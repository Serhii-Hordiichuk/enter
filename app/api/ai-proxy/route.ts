import { NextResponse } from 'next/server';
import type { ChatMessage } from '@/lib/ai/apiClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface ProxyBody { messages?: ChatMessage[]; model?: string; }
interface OpenAiChunk { choices?: Array<{ delta?: { content?: string } }>; }
interface AnthropicChunk { type?: string; delta?: { type?: string; text?: string }; content_block?: { text?: string }; }

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (candidate.role === 'system' || candidate.role === 'user' || candidate.role === 'assistant') && typeof candidate.content === 'string';
}

function sseEncode(token: string): string {
  return 'data: ' + JSON.stringify({ delta: token }) + '\n\n';
}

async function* iterateOpenAi(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        for (const line of frame.split('\n')) {
          const text = line.trim();
          if (!text.startsWith('data:')) continue;
          const data = text.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data) as OpenAiChunk;
            const token = parsed.choices?.[0]?.delta?.content ?? '';
            if (token) yield token;
          } catch (error) { console.error('AI proxy: malformed OpenAI chunk:', error); }
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  } finally { reader.releaseLock(); }
}

async function* iterateAnthropic(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const event: Record<string, string> = {};
        for (const line of frame.split('\n')) {
          const separator = line.indexOf(':');
          if (separator > 0) event[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
        }
        if (event.event === 'message_stop') return;
        if (event.data) {
          try {
            const parsed = JSON.parse(event.data) as AnthropicChunk;
            const token = parsed.delta?.text ?? parsed.content_block?.text ?? '';
            if (token) yield token;
          } catch (error) { console.error('AI proxy: malformed Anthropic chunk:', error); }
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  } finally { reader.releaseLock(); }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ProxyBody;
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0 || !body.messages.every(isChatMessage)) {
      return NextResponse.json({ error: 'The messages field must be a non-empty array of chat messages' }, { status: 400 });
    }
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const requestedModel = body.model?.trim() || 'gpt-4o-mini';
    const wantsAnthropic = requestedModel.toLowerCase().startsWith('claude');
    if (wantsAnthropic && !anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured on the server' }, { status: 500 });
    if (!wantsAnthropic && !openaiKey) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured on the server' }, { status: 500 });
    const timeoutMs = Number(process.env.AI_PROXY_TIMEOUT_MS ?? '30000');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30000);
    let upstream: Response;
    try {
      if (wantsAnthropic) {
        const system = body.messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n');
        const turns = body.messages.filter((message) => message.role !== 'system').map((message) => ({ role: message.role, content: message.content }));
        upstream = await fetch(process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey as string, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: requestedModel, max_tokens: 1024, stream: true, ...(system ? { system } : {}), messages: turns }),
        });
      } else {
        upstream = await fetch((process.env.OPENAI_BASE_URL ?? 'https://api.openai.com') + '/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (openaiKey as string) },
          body: JSON.stringify({ model: requestedModel, stream: true, messages: body.messages }),
        });
      }
    } finally { clearTimeout(timeout); }
    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => upstream.statusText);
      return NextResponse.json({ error: 'AI provider error: ' + detail.slice(0, 500) }, { status: 502 });
    }
    const tokens = wantsAnthropic ? iterateAnthropic(upstream.body) : iterateOpenAi(upstream.body);
    const stream = new ReadableStream<Uint8Array>({
      async start(streamController) {
        const encoder = new TextEncoder();
        try {
          for await (const token of tokens) streamController.enqueue(encoder.encode(sseEncode(token)));
          streamController.enqueue(encoder.encode('data: [DONE]\n\n'));
          streamController.close();
        } catch (error) {
          console.error('AI proxy streaming error:', error);
          streamController.error(error instanceof Error ? error : new Error('AI proxy streaming error'));
        }
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } });
  } catch (error) {
    console.error('AI proxy internal error:', error);
    return NextResponse.json({ error: 'AI proxy internal error' }, { status: 500 });
  }
}

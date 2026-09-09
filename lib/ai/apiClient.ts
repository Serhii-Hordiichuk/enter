/** Клієнт серверного ШІ через /api/ai-proxy зі стрімінгом SSE. */
export type AiRole = 'system' | 'user' | 'assistant';
export interface ChatMessage { role: AiRole; content: string; }
export interface ApiProxyRequest { messages: ChatMessage[]; model?: string; }

export async function* streamProxyResponse(request: ApiProxyRequest, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  try {
    const response = await fetch('/api/ai-proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal });
    if (!response.ok || !response.body) {
      let detail = '';
      try { detail = await response.text(); } catch { detail = ''; }
      throw new Error('Помилка AI-проксі (' + String(response.status) + '): ' + (detail || response.statusText));
    }
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const eventText = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        for (const line of eventText.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data) as { delta?: string; text?: string };
            const token = parsed.delta ?? parsed.text ?? '';
            if (token) yield token;
          } catch (error) { console.error('Не вдалося розібрати SSE-фрагмент ШІ:', error); }
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    console.error('Помилка стрімінгу AI-проксі:', error);
    throw error instanceof Error ? error : new Error('Помилка стрімінгу AI-проксі');
  } finally {
    try { reader?.releaseLock(); } catch (error) { console.error('Не вдалося звільнити SSE-рідер:', error); }
  }
}

export async function collectProxyResponse(request: ApiProxyRequest, signal?: AbortSignal): Promise<string> {
  let result = '';
  for await (const token of streamProxyResponse(request, signal)) result += token;
  return result;
}

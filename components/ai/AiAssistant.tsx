'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { collectProxyResponse, type ChatMessage } from '@/lib/ai/apiClient';
import { DEFAULT_LOCAL_MODEL, generateLocalResponse, isLocalAiSupported } from '@/lib/ai/localLlama';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface AiAssistantProps {
  roomId: string;
}

export function AiAssistant({ roomId }: AiAssistantProps): React.JSX.Element {
  const aiMode = useVortexStore((state) => state.aiMode);
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const context = useMemo(() => messages.slice(-10).map((message) => (message.mine ? 'Me: ' : 'Peer: ') + message.body).join('\n'), [messages]);

  const ask = async (): Promise<void> => {
    if (busy) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setAnswer('');
    try {
      const prompt: ChatMessage[] = [
        { role: 'system', content: 'You are a helpful assistant inside the decentralized Gotoap messenger. Answer in English, briefly and to the point.' },
        { role: 'user', content: 'Recent message context:\n' + (context || '(empty so far)') + '\n\nGive a helpful reply or continue the conversation.' },
      ];
      if (aiMode === 'local') {
        setStatus('Loading local model ' + DEFAULT_LOCAL_MODEL + '...');
        const text = await generateLocalResponse(prompt, DEFAULT_LOCAL_MODEL, (progress, statusText) => setStatus(statusText + ' (' + Math.round(progress * 100) + '%)'));
        if (controller.signal.aborted) return;
        setAnswer(text);
        setStatus('');
      } else {
        setStatus('Streaming via /api/ai-proxy...');
        const text = await collectProxyResponse({ messages: prompt }, controller.signal);
        if (controller.signal.aborted) return;
        setAnswer(text);
        setStatus('');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('AI assistant error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get an AI response');
      setStatus('');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  };

  return (
    <Card title="AI assistant" description={aiMode === 'local' ? 'Local model in the browser (WebGPU). No server.' : 'Server provider via the secure /api/ai-proxy proxy.'}>
      {!isLocalAiSupported() && aiMode === 'local' ? <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">WebGPU was not detected. Local mode may fail to start - try API mode in settings.</p> : null}
      <div className="mt-3 flex gap-2">
        <Button onClick={() => void ask()} disabled={busy}>{busy ? 'Thinking...' : 'Ask AI with context'}</Button>
        {busy ? <Button variant="secondary" onClick={() => abortRef.current?.abort()}>Stop</Button> : null}
      </div>
      {status ? <p className="mt-2 text-xs text-zinc-400">{status}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      {answer ? <p className="mt-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100">{answer}</p> : null}
    </Card>
  );
}

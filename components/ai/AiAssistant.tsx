'use client';

/** Slide-over AI assistant panel with the last 10 messages as context. */
import { useMemo, useRef, useState } from 'react';
import { CloseIcon, CpuIcon, GlobeIcon, SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { collectProxyResponse, type ChatMessage } from '@/lib/ai/apiClient';
import { DEFAULT_LOCAL_MODEL, generateLocalResponse, isLocalAiSupported } from '@/lib/ai/localLlama';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface AiAssistantProps {
  roomId: string;
  open: boolean;
  onClose: () => void;
}

export function AiAssistant({ roomId, open, onClose }: AiAssistantProps): React.JSX.Element | null {
  const aiMode = useVortexStore((state) => state.aiMode);
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const context = useMemo(
    () => messages.slice(-10).map((message) => (message.mine ? 'Me: ' : 'Peer: ') + message.body).join('\n'),
    [messages],
  );

  if (!open) return null;

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
    <aside
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-gotoap-line bg-gotoap-panel shadow-2xl shadow-black/60"
      role="complementary"
      aria-label="AI assistant panel"
    >
      <header className="flex items-center gap-2.5 border-b border-gotoap-line px-3 py-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gotoap-accent/15 text-gotoap-accent">
          <SparkIcon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gotoap-ink">AI assistant</p>
          <p className="flex items-center gap-1 text-xs text-gotoap-ink-muted">
            {aiMode === 'local' ? <CpuIcon size={12} /> : <GlobeIcon size={12} />}
            {aiMode === 'local' ? 'Local model on WebGPU' : 'Via /api/ai-proxy'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the AI panel"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink"
        >
          <CloseIcon size={18} />
        </button>
      </header>
      <div className="gotoap-scroll flex-1 overflow-y-auto p-3">
        {!isLocalAiSupported() && aiMode === 'local' ? (
          <p className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">WebGPU was not detected. Local mode may fail to start - try API mode in settings.</p>
        ) : null}
        <p className="text-xs text-gotoap-ink-muted">The assistant reads the last 10 messages of this chat as context.</p>
        {status ? <p className="mt-3 text-xs text-gotoap-accent-muted">{status}</p> : null}
        {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
        {answer ? (
          <div className="mt-3 rounded-2xl rounded-bl-md bg-gotoap-bubble-in px-3 py-2 text-sm text-gotoap-ink">
            <p className="whitespace-pre-wrap break-words">{answer}</p>
          </div>
        ) : null}
      </div>
      <footer className="border-t border-gotoap-line p-3">
        <div className="flex gap-2">
          <Button onClick={() => void ask()} disabled={busy} className="flex-1">{busy ? 'Thinking...' : 'Ask with chat context'}</Button>
          {busy ? <Button variant="secondary" onClick={() => abortRef.current?.abort()}>Stop</Button> : null}
        </div>
      </footer>
    </aside>
  );
}

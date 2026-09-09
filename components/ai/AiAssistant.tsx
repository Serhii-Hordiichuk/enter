'use client';

/** AI slide-over panel with the chat context (last 10 messages). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { generateLocalResponse } from '@/lib/ai/localLlama';
import { collectProxyResponse, type ChatMessage } from '@/lib/ai/apiClient';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { CloseIcon, SparkIcon } from '@/components/icons';

interface AiAssistantProps {
  roomId: string;
  open: boolean;
  onClose: () => void;
}

interface AiTurn { role: 'user' | 'assistant'; content: string; }

export function AiAssistant({ roomId, open, onClose }: AiAssistantProps): React.JSX.Element | null {
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);
  const aiMode = useVortexStore((state) => state.aiMode);
  const [turns, setTurns] = useState<AiTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, busy]);

  const ask = useCallback(async (prompt: string): Promise<void> => {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    setTurns((current) => [...current, { role: 'user', content: trimmed }]);
    try {
      const contextTurns: ChatMessage[] = messages.slice(-10).map((message) => ({
        role: 'user',
        content: (message.mine ? 'Me' : 'Peer') + ': ' + (message.deletedAt ? '(deleted)' : message.body),
      }));
      const chat: ChatMessage[] = [...contextTurns, { role: 'user', content: trimmed }];
      const answer = aiMode === 'local' ? await generateLocalResponse(chat) : await collectProxyResponse({ messages: chat });
      setTurns((current) => [...current, { role: 'assistant', content: answer }]);
    } catch (askError) {
      console.error('The AI request failed:', askError);
      setError(askError instanceof Error ? askError.message : 'The AI request failed');
    } finally {
      setBusy(false);
    }
  }, [aiMode, busy, messages]);

  if (!open) return null;

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-gotoap-line bg-gotoap-panel shadow-2xl shadow-black/50 sm:w-96" aria-label="AI assistant panel">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gotoap-line px-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gotoap-accent/15 text-gotoap-accent"><SparkIcon size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gotoap-ink">AI Assistant</p>
          <p className="text-[11px] text-gotoap-ink-muted">{aiMode === 'local' ? 'Local model (WebGPU)' : 'Cloud API via proxy'}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close the AI panel" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
          <CloseIcon size={17} />
        </button>
      </header>
      <div ref={scrollRef} className="gotoap-scroll flex-1 space-y-3 overflow-y-auto p-3">
        {turns.length === 0 ? (
          <div className="rounded-xl bg-gotoap-hover/60 p-3 text-sm text-gotoap-ink-muted">
            Ask anything about this chat. The assistant sees the last 10 messages as context.
          </div>
        ) : (
          turns.map((turn, index) => (
            <div key={index} className={'rounded-xl px-3 py-2 text-sm ' + (turn.role === 'user' ? 'ml-6 bg-gotoap-active text-white' : 'mr-6 bg-gotoap-hover text-gotoap-ink')}>
              <p className="whitespace-pre-wrap break-words">{turn.content}</p>
            </div>
          ))
        )}
        {busy ? <p className="text-xs text-gotoap-ink-muted">Thinking...</p> : null}
        {error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p> : null}
      </div>
      <form
        onSubmit={(event) => { event.preventDefault(); const prompt = input; setInput(''); void ask(prompt); }}
        className="border-t border-gotoap-line p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl bg-gotoap-hover px-3 py-1.5">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the assistant..."
            aria-label="AI prompt"
            className="h-9 flex-1 bg-transparent text-sm text-gotoap-ink placeholder:text-gotoap-ink-muted focus:outline-none"
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send the prompt" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gotoap-accent text-white transition hover:bg-gotoap-accent-hover disabled:opacity-40">
            <SparkIcon size={15} />
          </button>
        </div>
      </form>
    </aside>
  );
}

'use client';

import type { AiMode } from '@/lib/store/useVortexStore';

interface AiToggleProps {
  mode: AiMode;
  onChange: (mode: AiMode) => void;
}

export function AiToggle({ mode, onChange }: AiToggleProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-gotoap-line bg-gotoap-bg p-1 text-sm" role="tablist" aria-label="Artificial intelligence mode">
      <button type="button" role="tab" aria-selected={mode === 'local'} onClick={() => onChange('local')} className={'rounded-lg px-3 py-2 font-medium transition ' + (mode === 'local' ? 'bg-gotoap-accent text-white' : 'text-gotoap-ink-muted hover:text-gotoap-ink')}>Local</button>
      <button type="button" role="tab" aria-selected={mode === 'api'} onClick={() => onChange('api')} className={'rounded-lg px-3 py-2 font-medium transition ' + (mode === 'api' ? 'bg-gotoap-accent text-white' : 'text-gotoap-ink-muted hover:text-gotoap-ink')}>Via API</button>
    </div>
  );
}

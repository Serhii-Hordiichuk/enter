'use client';

import type { AiMode } from '@/lib/store/useVortexStore';

interface AiToggleProps {
  mode: AiMode;
  onChange: (mode: AiMode) => void;
}

export function AiToggle({ mode, onChange }: AiToggleProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1 text-sm" role="tablist" aria-label="Artificial intelligence mode">
      <button type="button" role="tab" aria-selected={mode === 'local'} onClick={() => onChange('local')} className={'rounded-lg px-3 py-2 font-medium transition ' + (mode === 'local' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-100')}>Local</button>
      <button type="button" role="tab" aria-selected={mode === 'api'} onClick={() => onChange('api')} className={'rounded-lg px-3 py-2 font-medium transition ' + (mode === 'api' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-100')}>Via API</button>
    </div>
  );
}

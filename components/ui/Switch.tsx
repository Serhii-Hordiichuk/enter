'use client';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function Switch({ checked, onChange, label, description }: SwitchProps): React.JSX.Element {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left transition hover:border-zinc-700">
      <span>
        <span className="block text-sm font-medium text-zinc-100">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-zinc-400">{description}</span> : null}
      </span>
      <span className={'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ' + (checked ? 'bg-indigo-600' : 'bg-zinc-700')}>
        <span className={'inline-block h-5 w-5 transform rounded-full bg-white shadow transition ' + (checked ? 'translate-x-5' : 'translate-x-1')} />
      </span>
    </button>
  );
}

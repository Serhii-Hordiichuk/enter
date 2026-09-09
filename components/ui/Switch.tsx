'use client';

interface SwitchProps {
  checked: boolean;
  label: string;
  description?: string;
  onChange: (checked: boolean) => void;
}

/** Custom toggle switch row. */
export function Switch({ checked, label, description, onChange }: SwitchProps): React.JSX.Element {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-gotoap-line bg-gotoap-panel px-4 py-3 text-left transition hover:border-gotoap-hover">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gotoap-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-gotoap-ink-muted">{description}</span> : null}
      </span>
      <span className={'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ' + (checked ? 'bg-gotoap-accent' : 'bg-gotoap-hover')}>
        <span className={'inline-block h-5 w-5 transform rounded-full bg-white shadow transition ' + (checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </span>
    </button>
  );
}

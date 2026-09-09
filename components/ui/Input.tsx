import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export function Input({ label, error = null, id, className = '', ...props }: InputProps): React.JSX.Element {
  const inputId = id ?? (label ? 'input-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <label className="block" htmlFor={inputId}>
      {label ? <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</span> : null}
      <input id={inputId} className={'h-10 w-full rounded-lg border bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 ' + (error ? 'border-red-500 focus:ring-red-500/40' : 'border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/30') + ' ' + className} {...props} />
      {error ? <span className="mt-1 block text-xs text-red-400">{error}</span> : null}
    </label>
  );
}

import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-gotoap-accent text-white hover:bg-gotoap-accent-hover focus-visible:outline-gotoap-accent disabled:bg-gotoap-accent/40',
  secondary: 'bg-gotoap-hover text-gotoap-ink hover:bg-[#2a3846] focus-visible:outline-gotoap-accent-muted disabled:bg-gotoap-panel',
  ghost: 'bg-transparent text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink focus-visible:outline-gotoap-accent-muted',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-400',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }: ButtonProps): React.JSX.Element {
  return <button type={type} className={'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ' + VARIANTS[variant] + ' ' + SIZES[size] + ' ' + className} {...props} />;
}

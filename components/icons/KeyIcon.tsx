import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom key icon (DID identity). */
export function KeyIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <circle cx="7.5" cy="16.5" r="3.8" stroke="currentColor" strokeWidth={1.8} />
      <path d="M10.4 13.6 20 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M15.4 8.6 19 12.2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

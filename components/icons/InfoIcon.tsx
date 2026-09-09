import { IconBase } from './IconBase';

interface IconProps { size?: number; className?: string; }

/** Custom info icon. */
export function InfoIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth={1.8} />
      <path d="M12 10.8V16" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.1" fill="currentColor" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps { size?: number; className?: string; }

/** Custom archive box icon. */
export function ArchiveIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.4" stroke="currentColor" strokeWidth={1.8} />
      <path d="M5.5 9v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9" stroke="currentColor" strokeWidth={1.8} />
      <path d="M10 13h4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps { size?: number; className?: string; }

/** Custom camera-off icon. */
export function VideoOffIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2.2" stroke="currentColor" strokeWidth={1.8} />
      <path d="m15.5 11 5.5-3v8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 3.5 20 19" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

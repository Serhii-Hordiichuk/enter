import { IconBase } from './IconBase';

interface IconProps { size?: number; className?: string; }

/** Custom muted-microphone icon. */
export function MicOffIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="9.2" y="3" width="5.6" height="10.5" rx="2.8" stroke="currentColor" strokeWidth={1.8} />
      <path d="M5.8 11.2a6.2 6.2 0 0 0 10 4.4M17.8 13a6 6 0 0 0 .4-1.8" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M12 17.6V21M9 21h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

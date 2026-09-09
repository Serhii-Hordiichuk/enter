import { IconBase } from './IconBase';

interface IconProps { size?: number; className?: string; }

/** Custom end-call icon (handset crossed). */
export function PhoneOffIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M4.6 12.8c4.1-4.6 10.7-4.6 14.8 0l-2.6 2.7-3-1.7v-2.6a10 10 0 0 0-3.6 0v2.6l-3 1.7-2.6-2.7Z" fill="currentColor" />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

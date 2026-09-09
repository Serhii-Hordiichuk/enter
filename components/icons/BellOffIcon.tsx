import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom muted-bell icon (muted chats). */
export function BellOffIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M13.7 20.2a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M17.9 12.6a15.5 15.5 0 01-.6-4.3 5.3 5.3 0 00-8.2-4.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M6.6 6.6c-.2.5-.3 1.1-.3 1.7 0 6.4-2.8 8.2-2.8 8.2h12.4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 3.5l17 17" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

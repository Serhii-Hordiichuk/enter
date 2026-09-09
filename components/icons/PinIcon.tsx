import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom pushpin icon (pinned chats). */
export function PinIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path
        d="M15 3.6l5.4 5.4-2.9.8-3.6 3.6.3 3.3-1.4 1.4-6.3-6.3L7.9 10l3.3.3 3.6-3.6.2-3.1Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.2 16.8 3 21" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function ContactsIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7" />
      <circle cx="16.5" cy="9.5" r="2.3" strokeWidth={1.6} />
      <path d="M16 14.6c2.2.3 3.8 1.7 4.3 4" strokeWidth={1.6} />
    </IconBase>
  );
}

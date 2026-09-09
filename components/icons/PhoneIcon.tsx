import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function PhoneIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
      <path d="M6.8 3.8c.5 0 2.3 3 2.3 3.5 0 1.2-1.3 1.7-1.3 2.7 0 1.8 3 4.9 4.9 4.9 1 0 1.5-1.3 2.7-1.3.5 0 3.5 1.8 3.5 2.3v2.3c0 .8-.7 1.3-1.5 1.3C9.8 19.5 4.2 13.9 4.2 6.1c0-1.3.5-2.3 2.6-2.3Z" />
    </IconBase>
  );
}

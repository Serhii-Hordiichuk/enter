import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function VideoIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
      <rect x="3" y="6.5" width="12" height="11" rx="2.5" />
      <path d="m15 10.5 5.5-3.5v10L15 13.5" />
    </IconBase>
  );
}

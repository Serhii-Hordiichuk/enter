import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function ClipIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 12.5 6.5-6.5a2.6 2.6 0 0 1 3.7 3.7l-8.6 8.6a4.5 4.5 0 0 1-6.4-6.4l8-8" />
    </IconBase>
  );
}

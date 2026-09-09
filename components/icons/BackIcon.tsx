import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function BackIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </IconBase>
  );
}

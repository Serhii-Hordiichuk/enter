import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function MoreIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <circle cx="5.5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.5" fill="currentColor" />
    </IconBase>
  );
}

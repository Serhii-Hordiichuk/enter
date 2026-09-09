import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom stop icon. */
export function StopIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" />
    </IconBase>
  );
}

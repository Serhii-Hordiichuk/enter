import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom monitor icon (system theme). */
export function MonitorIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="3" y="4.5" width="18" height="12.5" rx="2" stroke="currentColor" strokeWidth={1.8} />
      <path d="M9 20.5h6M12 17v3.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

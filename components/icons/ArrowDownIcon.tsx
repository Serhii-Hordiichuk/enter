import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom arrow-down icon (scroll to latest). */
export function ArrowDownIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M12 4.5v15M5.5 13l6.5 6.5 6.5-6.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

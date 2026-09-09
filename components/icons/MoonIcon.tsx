import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom moon icon (dark theme). */
export function MoonIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6a8.6 8.6 0 1 0 10.6 10.6Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
    </IconBase>
  );
}

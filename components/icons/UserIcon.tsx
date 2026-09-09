import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom user icon (profile). */
export function UserIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={1.8} />
      <path d="M4.6 20.2a7.4 7.4 0 0114.8 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

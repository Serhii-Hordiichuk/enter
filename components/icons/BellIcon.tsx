import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom bell icon. */
export function BellIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M13.7 20.2a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M6.3 16.5s2.8-1.8 2.8-8.2a2.9 2.9 0 015.8 0c0 6.4 2.8 8.2 2.8 8.2H6.3Z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

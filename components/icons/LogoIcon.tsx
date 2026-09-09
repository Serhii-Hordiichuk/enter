import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom Gotoap wordmark: two overlapping peer orbs with a bolt path. */
export function LogoIcon({ size = 28, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <circle cx="9" cy="12" r="6.5" fill="currentColor" opacity=".28" />
      <circle cx="15.5" cy="12" r="6.5" fill="currentColor" opacity=".16" />
      <path d="M13.4 7.2 8.7 13h3.1l-1 3.8 4.9-6.1h-3.2l.9-3.5Z" fill="currentColor" />
    </IconBase>
  );
}

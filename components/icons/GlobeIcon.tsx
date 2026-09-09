import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom globe icon (network / API providers). */
export function GlobeIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth={1.8} />
      <path d="M3.4 12h17.2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M12 3.4a13.4 13.4 0 010 17.2 13.4 13.4 0 010-17.2Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom image icon. */
export function ImageIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.2" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path d="M4.5 17.5l4.8-4.3 3.2 2.9 3.4-3.4 3.6 3.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

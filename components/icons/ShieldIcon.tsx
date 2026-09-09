import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom shield-with-check icon (security). */
export function ShieldIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M12 3l7.2 2.9v5.4c0 4.4-2.9 7.9-7.2 9.7-4.3-1.8-7.2-5.3-7.2-9.7V5.9L12 3Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M9 11.8l2.1 2.1 4-4.2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom double check icon (read), like modern messengers. */
export function DoubleCheckIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M1.8 12.6l4 4 7.6-7.9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.4 16.6l1.6 1.6L21.6 7.2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

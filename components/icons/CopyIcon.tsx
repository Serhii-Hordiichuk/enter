import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom copy icon. */
export function CopyIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2.2" stroke="currentColor" strokeWidth={1.8} />
      <path d="M5.5 15h-.7A1.8 1.8 0 013 13.2V4.8A1.8 1.8 0 014.8 3h8.4A1.8 1.8 0 0115 4.8v.7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

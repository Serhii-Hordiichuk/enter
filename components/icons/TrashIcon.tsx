import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom trash icon (delete chat). */
export function TrashIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M4 6.5h16" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M9.5 6.5V4.8A1.8 1.8 0 0111.3 3h1.4a1.8 1.8 0 011.8 1.8v1.7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M6.2 6.5l.9 12.6a2 2 0 002 1.9h5.8a2 2 0 002-1.9l.9-12.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10.5v6M14 10.5v6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

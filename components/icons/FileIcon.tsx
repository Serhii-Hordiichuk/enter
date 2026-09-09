import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom file icon. */
export function FileIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M6 3h7.5L19 8.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M13.5 3v5.5H19" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function SavedIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V4.5a1 1 0 0 1 1-1Z" />
      <path d="M12 8v5M9.5 10.5 12 8l2.5 2.5" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom pause icon. */
export function PauseIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M8 5.5v13" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M16 5.5v13" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
    </IconBase>
  );
}

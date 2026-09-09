import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom play icon. */
export function PlayIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
    </IconBase>
  );
}

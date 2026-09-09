import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function CloseIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  );
}

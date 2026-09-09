import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function PlusIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

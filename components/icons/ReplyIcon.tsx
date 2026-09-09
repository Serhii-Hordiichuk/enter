import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom reply icon. */
export function ReplyIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M9.5 6.5L4 12l5.5 5.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 12h9a6 6 0 016 6v1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

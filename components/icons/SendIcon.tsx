import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

export function SendIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 3 10.2 13.8M21 3l-6.8 18-3.8-7.2L3.2 10 21 3ZM21 3 13 10" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom forward icon. */
export function ForwardIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M14.5 6.5L20 12l-5.5 5.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 12h-9a6 6 0 00-6 6v1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

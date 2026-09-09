import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom pencil icon. */
export function PencilIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1Z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

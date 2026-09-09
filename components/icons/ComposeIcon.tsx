import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom compose (new chat) icon: a pencil over a square. */
export function ComposeIcon({ size = 22, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path
        d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.2 3.6a2 2 0 0 1 2.9 2.9L12.6 14l-3.9 1 1-3.9 7.5-7.5Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom AI sparkle icon. */
export function SparkIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M11 3.5l1.7 4.9 4.9 1.7-4.9 1.7L11 16.7l-1.7-4.9-4.9-1.7 4.9-1.7L11 3.5Z" fill="currentColor" />
      <path d="M18.3 14.4l.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8.8-2.3Z" fill="currentColor" opacity=".75" />
    </IconBase>
  );
}

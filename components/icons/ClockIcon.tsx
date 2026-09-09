import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom clock icon (pending message). */
export function ClockIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth={1.8} />
      <path d="M12 7.6V12l3 2.1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

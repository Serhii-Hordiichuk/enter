import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom download icon. */
export function DownloadIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M12 4v10" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M7.5 10.5L12 15l4.5-4.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19.5h14" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

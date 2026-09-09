import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom sticker icon. */
export function StickerIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M21 12a9 9 0 11-9-9 9 9 0 019 9Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M21 12h-4.5a4.5 4.5 0 00-4.5 4.5V21" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx="8.8" cy="10" r="1.1" fill="currentColor" />
      <circle cx="13.5" cy="8.5" r="1.1" fill="currentColor" />
    </IconBase>
  );
}

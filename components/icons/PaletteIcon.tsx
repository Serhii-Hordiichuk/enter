import { IconBase } from './IconBase';
export function PaletteIcon(props: { size?: number; className?: string }): React.JSX.Element {
  return (
    <IconBase size={props.size} className={props.className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.52-4.48-10-10-10z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6.5" cy="10" r="1.3" fill="currentColor" />
      <circle cx="9.5" cy="6" r="1.3" fill="currentColor" />
      <circle cx="14.5" cy="6" r="1.3" fill="currentColor" />
      <circle cx="17.5" cy="10" r="1.3" fill="currentColor" />
    </IconBase>
  );
}

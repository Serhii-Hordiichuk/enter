import { IconBase } from './IconBase';
export function MapPinIcon(props: { size?: number; className?: string }): React.JSX.Element {
  return (
    <IconBase size={props.size} className={props.className}>
      <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </IconBase>
  );
}

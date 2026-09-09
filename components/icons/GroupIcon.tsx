import { IconBase } from './IconBase';
export function GroupIcon(props: { size?: number; className?: string }): React.JSX.Element {
  return (
    <IconBase size={props.size} className={props.className}>
      <circle cx="9" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 17c0-2 2-3.5 4-3.5s4 1.5 4 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 17c0-2 2-3.5 4-3.5s4 1.5 4 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </IconBase>
  );
}

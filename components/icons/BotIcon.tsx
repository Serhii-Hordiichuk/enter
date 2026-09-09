import { IconBase } from './IconBase';
export function BotIcon(props: { size?: number; className?: string }): React.JSX.Element {
  return (
    <IconBase size={props.size} className={props.className}>
      <rect x="6" y="8" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" />
      <path d="M12 4v4M8 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

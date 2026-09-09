import { IconBase } from './IconBase';
export function MediaIcon(props: { size?: number; className?: string }): React.JSX.Element {
  return (
    <IconBase size={props.size} className={props.className} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M21 15l-5-5L5 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

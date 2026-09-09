import { IconBase } from './IconBase';
export function MissedCallIcon(props: { size?: number; className?: string }): React.JSX.Element {
  return (
    <IconBase size={props.size} className={props.className} viewBox="0 0 24 24">
      <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21c.27-.27.35-.66.24-1.01A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM5 5l14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </IconBase>
  );
}

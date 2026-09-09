import { IconBase } from './IconBase';
export function UnarchiveIcon(props: { size?: number; className?: string }): React.JSX.Element {
  return (
    <IconBase size={props.size} className={props.className} viewBox="0 0 24 24">
      <path d="M21 8v13H3V8M1 3h22v5H1V3zm9 8h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

import { IconBase } from './IconBase';

/** Custom folder icon for the sidebar navigation tabs. */
export function FolderIcon({ size = 16, className }: { size?: number; className?: string }): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M3 3 L3 3 L5.5 2 L8.5 2 L11 3 L13 3.4 L13 3.8 L11 4.4 L8.5 5 L5.5 5.4 L3 5 L3 5 L3 13 M3 13 L13 13 L13 13 L11 12 L8.5 11.4 L5.5 11 L3 12 L3 12" />
    </IconBase>
  );
}

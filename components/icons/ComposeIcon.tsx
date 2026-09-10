import { IconBase } from './IconBase';

/** Compose (new message) icon. */
export function ComposeIcon(props: React.ComponentProps<typeof IconBase>): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V12c0-5.52-4.48-10-10-10zm7 13h-4v-2h4V15zm0-4h-4V9h4v2z" fill="currentColor" />
    </IconBase>
  );
}

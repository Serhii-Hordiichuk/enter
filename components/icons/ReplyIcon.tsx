import { IconBase } from './IconBase';

/** Reply icon. */
export function ReplyIcon(props: React.ComponentProps<typeof IconBase>): React.JSX.Element {
  return (
    <IconBase {...props}>
      <path d="M9.5 12c0-1.1-.45-2.11-1.19-2.85L6.36 9.81v5.38l3.95-3.95c.74-.74 1.19-1.71 1.19-2.85zm-5 3v-2h5.31l-3.66-3.66 1.41-1.41L15 12.39V7h5v5.39l3.66-3.66-1.41-1.41L10.86 5.41V2.5H6v5z" fill="currentColor" />
    </IconBase>
  );
}

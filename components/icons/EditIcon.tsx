import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom edit icon. */
export function EditIcon({ size = 20, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M14.5 5.5l4 4L8 20H4v-4L14.5 5.5Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M12.5 7.5l4 4" stroke="currentColor" strokeWidth={1.8} />
    </IconBase>
  );
}

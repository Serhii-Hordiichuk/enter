import { IconBase } from './IconBase';

interface StrokeIconProps {
  size?: number;
  className?: string;
}

function Stroke({ size = 20, className, children }: StrokeIconProps & { children: React.ReactNode }): React.JSX.Element {
  return (
    <IconBase size={size} className={className} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </IconBase>
  );
}

export function ChatsIcon(props: StrokeIconProps): React.JSX.Element {
  return (
    <Stroke {...props}>
      <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4.2 3.2c-.5.38-1.3.03-1.3-.6V6.5a1 1 0 0 1 1-1Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </Stroke>
  );
}

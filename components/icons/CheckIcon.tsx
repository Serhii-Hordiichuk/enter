import { IconBase } from './IconBase';

interface IconProps {
  size?: number;
  className?: string;
}

/** Custom single check icon (delivered). */
export function CheckIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

/** Custom double check icon (read), like modern messengers. */
export function DoubleCheckIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <path d="M1.8 12.6l4 4 7.6-7.9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.4 16.6l1.6 1.6L21.6 7.2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

/** Custom clock icon (pending message). */
export function ClockIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth={1.8} />
      <path d="M12 7.6V12l3 2.1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

/** Custom padlock icon (end-to-end encryption). */
export function LockIcon({ size = 16, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth={1.8} />
      <path d="M8 10.5V7.8a4 4 0 018 0v2.7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="12" cy="15.2" r="1.4" fill="currentColor" />
    </IconBase>
  );
}

/** Custom copy icon. */
export function CopyIcon({ size = 18, className }: IconProps): React.JSX.Element {
  return (
    <IconBase size={size} className={className}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2.2" stroke="currentColor" strokeWidth={1.8} />
      <path d="M5.5 15h-.7A1.8 1.8 0 013 13.2V4.8A1.8 1.8 0 014.8 3h8.4A1.8 1.8 0 0115 4.8v.7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </IconBase>
  );
}

'use client';

/** Welcome pane shown in the right column when no chat is selected. */
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CpuIcon, GlobeIcon, LogoIcon, ShieldIcon } from '@/components/icons';
import { t } from '@/lib/i18n';
import { NetworkNodeCard } from '@/components/did/NetworkNodeCard';

interface WelcomePaneProps {
  onStartChat: () => void;
}

const FEATURES = [
  { icon: <ShieldIcon size={16} />, text: 'Ed25519-signed messages, AES-GCM encrypted.' },
  { icon: <CpuIcon size={16} />, text: 'Local AI that runs in your browser on WebGPU.' },
  { icon: <GlobeIcon size={16} />, text: 'No storage servers: WebRTC peers + WebTorrent history.' },
] as const;

export function WelcomePane({ onStartChat }: WelcomePaneProps): React.JSX.Element {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <span className="inline-flex h-24 w-24 items-center justify-center rounded-[28px] bg-gotoap-accent/15 text-gotoap-accent shadow-2xl shadow-gotoap-accent/10">
        <LogoIcon size={60} />
      </span>
      <div>
        <h1 className="text-3xl font-bold text-gotoap-ink">{t('app.name')}</h1>
        <p className="mt-2 text-sm text-gotoap-ink-muted">{t('chat.empty.title')}</p>
      </div>
      <ul className="flex w-full flex-col gap-2.5 text-left">
        {FEATURES.map((feature) => (
          <li key={feature.text} className="flex items-center gap-3 rounded-xl bg-gotoap-panel/70 px-3.5 py-2.5 text-sm text-gotoap-ink-muted">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gotoap-accent/15 text-gotoap-accent">{feature.icon}</span>
            {feature.text}
          </li>
        ))}
      </ul>
      <NetworkNodeCard />
      <div className="flex gap-2">
        <Button onClick={onStartChat}>{t('chat.startNew')}</Button>
        <Link href="/settings"><Button variant="secondary">{t('chat.settings')}</Button></Link>
      </div>
    </div>
  );
}

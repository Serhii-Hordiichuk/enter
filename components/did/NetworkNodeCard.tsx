'use client';

/**
 * Info card that makes the P2P node nature explicit:
 * "Your device is a network node" — shows DID, peer count, status.
 */
import { useVortexStore } from '@/lib/store/useVortexStore';
import { t } from '@/lib/i18n';
import { GlobeIcon, LogoIcon } from '@/components/icons';

export function NetworkNodeCard(): React.JSX.Element {
  const currentDid = useVortexStore((state) => state.currentDid);
  const peers = useVortexStore((state) => state.peers);
  const peerCount = Object.keys(peers).length;

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-gotoap-line bg-gotoap-panel p-4">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gotoap-accent/15 text-gotoap-accent">
          <LogoIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gotoap-ink">{t('chat.node.title')}</p>
          <p className="text-xs text-gotoap-ink-muted">{t('app.tagline')}</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-gotoap-ink-faint">{t('chat.node.desc')}</p>

      <div className="flex items-center gap-3 rounded-xl bg-gotoap-hover px-3 py-2">
        <GlobeIcon size={15} className="shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gotoap-ink-muted">{t('chat.node.status')}</p>
          <p className="text-sm font-medium text-emerald-400">{t('chat.node.statusActive')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-gotoap-hover px-3 py-2">
        <GlobeIcon size={15} className="shrink-0 text-gotoap-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gotoap-ink-muted">{t('chat.node.peers')}</p>
          <p className="text-sm font-medium text-gotoap-ink">{peerCount}</p>
        </div>
      </div>

      {currentDid ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gotoap-ink-faint">{t('chat.node.did')}:</span>
          <code className="truncate font-mono text-[11px] text-gotoap-ink-muted">{currentDid.did}</code>
        </div>
      ) : null}
    </div>
  );
}
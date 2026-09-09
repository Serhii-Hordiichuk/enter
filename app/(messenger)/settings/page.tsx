'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AiToggle } from '@/components/ai/AiToggle';
import { DidBadge } from '@/components/did/DidBadge';
import { Avatar } from '@/components/profile/Avatar';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BackIcon, CpuIcon, GlobeIcon, LockIcon, ShieldIcon } from '@/components/icons';
import { clearStoredDIDKeyPair } from '@/lib/did/keyGenerator';
import { useVortexStore, type AiMode } from '@/lib/store/useVortexStore';

/** Settings: profile, AI mode, DID, and security information. */
export default function SettingsPage(): React.JSX.Element {
  const router = useRouter();
  const profile = useVortexStore((state) => state.profile);
  const did = useVortexStore((state) => state.currentDid?.did ?? null);
  const aiMode = useVortexStore((state) => state.aiMode);
  const switchAiMode = useVortexStore((state) => state.switchAiMode);
  const apiKey = useVortexStore((state) => state.apiKey);
  const setApiKey = useVortexStore((state) => state.setApiKey);
  const [draftKey, setDraftKey] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { setDraftKey(apiKey ?? ''); }, [apiKey]);

  const saveKey = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setApiKey(draftKey.trim().length > 0 ? draftKey.trim() : null);
    setNotice('API key saved locally in this browser.');
  };

  const resetDid = (): void => {
    clearStoredDIDKeyPair();
    setNotice('DID removed from this browser. Reload the page to create a new one.');
  };

  const changeMode = (mode: AiMode): void => {
    switchAiMode(mode);
    setNotice(mode === 'local' ? 'Local AI enabled (WebGPU, Llama-3.2-1B).' : 'API mode enabled via /api/ai-proxy.');
  };

  return (
    <div className="gotoap-scroll h-full w-full overflow-y-auto">
      <header className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-gotoap-line bg-gotoap-panel/95 px-2 py-2 backdrop-blur sm:px-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Back to the chat list"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink lg:hidden"
        >
          <BackIcon size={20} />
        </button>
        <h1 className="text-base font-semibold text-gotoap-ink">Settings</h1>
      </header>
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        {notice ? <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}

        <Card title="Profile" description="Stored only in this browser - never uploaded anywhere.">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar seed={did ?? 'gotoap'} name={profile.displayName} colorId={profile.colorId} size={56} />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-gotoap-ink">{profile.displayName || 'Anonymous peer'}</p>
                <p className="truncate text-xs text-gotoap-ink-muted">{profile.bio || 'No bio yet'}</p>
              </div>
            </div>
            {did ? <DidBadge did={did} compact /> : <p className="text-sm text-gotoap-ink-muted">No DID created yet.</p>}
            {did ? <ProfileEditor seed={did} /> : null}
            {did ? <Button variant="danger" size="sm" onClick={resetDid}>Remove DID from browser</Button> : null}
          </div>
        </Card>

        <Card title="Artificial intelligence" description="Local mode runs fully in your browser on WebGPU. API mode goes through the server-side Edge proxy.">
          <div className="flex flex-col gap-4">
            <AiToggle mode={aiMode} onChange={changeMode} />
            {aiMode === 'local' ? (
              <p className="flex items-center gap-2 text-xs text-gotoap-ink-muted">
                <CpuIcon size={14} className="shrink-0 text-gotoap-accent" />
                Model: Llama-3.2-1B-Instruct-q4f16_1-MLC, downloaded once and cached in the browser.
              </p>
            ) : (
              <form onSubmit={saveKey} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Input label="Local API key (optional)" type="password" value={draftKey} onChange={(event) => setDraftKey(event.target.value)} placeholder="sk-..." autoComplete="off" />
                </div>
                <Button type="submit">Save</Button>
              </form>
            )}
            <p className="flex items-center gap-2 text-xs text-gotoap-ink-muted">
              {aiMode === 'api' ? <GlobeIcon size={14} className="shrink-0 text-gotoap-accent" /> : <GlobeIcon size={14} className="shrink-0 text-gotoap-ink-faint" />}
              Provider keys live in Vercel environment variables; the client never sees them.
            </p>
          </div>
        </Card>

        <Card title="Security" description="How Gotoap protects your conversations.">
          <ul className="flex flex-col gap-2.5 text-sm text-gotoap-ink-muted">
            <li className="flex items-center gap-3"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gotoap-accent/15 text-gotoap-accent"><LockIcon size={15} /></span>AES-GCM room keys derived per chat.</li>
            <li className="flex items-center gap-3"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gotoap-accent/15 text-gotoap-accent"><ShieldIcon size={15} /></span>Every message is signed with your Ed25519 DID key.</li>
            <li className="flex items-center gap-3"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gotoap-accent/15 text-gotoap-accent"><LockIcon size={15} /></span>History is stored encrypted; only this browser holds the keys.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

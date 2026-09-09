'use client';

/** Settings: profile, appearance, AI mode, privacy, and data export. */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AiToggle } from '@/components/ai/AiToggle';
import { Avatar } from '@/components/profile/Avatar';
import { DidBadge } from '@/components/did/DidBadge';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { BackIcon, BellOffIcon, ClockIcon, CpuIcon, DownloadIcon, KeyIcon, MonitorIcon, MoonIcon, ShieldIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { exportAllData } from '@/lib/messaging/messenger';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ru', label: 'Russian' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Espanol' },
];

export default function SettingsPage(): React.JSX.Element {
  const router = useRouter();
  const did = useVortexStore((state) => state.currentDid?.did ?? null);
  const profile = useVortexStore((state) => state.profile);
  const aiMode = useVortexStore((state) => state.aiMode);
  const apiKey = useVortexStore((state) => state.apiKey);
  const setApiKey = useVortexStore((state) => state.setApiKey);
  const switchAiMode = useVortexStore((state) => state.switchAiMode);
  const theme = useVortexStore((state) => state.theme);
  const setTheme = useVortexStore((state) => state.setTheme);
  const updateProfile = useVortexStore((state) => state.updateProfile);
  const [keyDraft, setKeyDraft] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => { setKeyDraft(apiKey ?? ''); }, [apiKey]);

  const saveKey = (): void => {
    setApiKey(keyDraft.trim() || null);
    setKeySaved(true);
    window.setTimeout(() => setKeySaved(false), 1500);
  };

  const exportData = (): void => {
    try {
      exportAllData();
      setExported(true);
      window.setTimeout(() => setExported(false), 1500);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-gotoap-bg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gotoap-line bg-gotoap-panel px-4">
        <button type="button" onClick={() => router.push('/')} aria-label="Back to chats" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
          <BackIcon size={20} />
        </button>
        <h1 className="text-base font-semibold text-gotoap-ink">Settings</h1>
      </header>

      <div className="gotoap-scroll flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">

          <section className="rounded-2xl border border-gotoap-line bg-gotoap-panel p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gotoap-ink-muted">Profile</h2>
            {did ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Avatar seed={did} name={profile.displayName} colorId={profile.avatarColor} size={72} />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-gotoap-ink">{profile.displayName || 'Anonymous peer'}</p>
                    <p className="truncate text-sm text-gotoap-ink-muted">{profile.bio || 'No bio yet'}</p>
                  </div>
                </div>
                <DidBadge did={did} />
                <ProfileEditor seed={did} />
              </div>
            ) : (
              <p className="text-sm text-gotoap-ink-muted">No DID created yet.</p>
            )}
          </section>

          <section className="rounded-2xl border border-gotoap-line bg-gotoap-panel p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gotoap-ink-muted">
              <CpuIcon size={15} /> Artificial intelligence
            </h2>
            <AiToggle mode={aiMode} onChange={switchAiMode} />
            <p className="mt-2 text-xs text-gotoap-ink-muted">{aiMode === 'local' ? 'Llama-3.2-1B runs locally through WebGPU. Nothing leaves your device.' : 'Requests go through the /api/ai-proxy Edge Function with a server-side key.'}</p>
            {aiMode === 'api' ? (
              <div className="mt-3 flex flex-col gap-2">
                <Input label="Provider API key (optional: the server key is used by default)" value={keyDraft} onChange={(event) => setKeyDraft(event.target.value)} placeholder="sk-..." type="password" />
                <div className="flex items-center gap-2">
                  <Button onClick={saveKey} className="px-4">{keySaved ? 'Saved' : 'Save key'}</Button>
                  {apiKey ? <span className="text-xs text-emerald-400">A key is stored locally</span> : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-gotoap-line bg-gotoap-panel p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gotoap-ink-muted">
              <ShieldIcon size={15} /> Privacy and security
            </h2>
            <ul className="flex flex-col gap-3 text-sm text-gotoap-ink-muted">
              <li className="flex items-start gap-2.5"><KeyIcon size={15} className="mt-0.5 shrink-0 text-gotoap-accent" /> Messages are signed with Ed25519 and encrypted with AES-GCM per room.</li>
              <li className="flex items-start gap-2.5"><ClockIcon size={15} className="mt-0.5 shrink-0 text-gotoap-accent" /> History is stored only in this browser and in the WebTorrent swarm.</li>
              <li className="flex items-start gap-2.5"><ShieldIcon size={15} className="mt-0.5 shrink-0 text-gotoap-accent" /> The profile is never uploaded: it travels only inside your P2P rooms.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gotoap-line bg-gotoap-panel p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gotoap-ink-muted">Data</h2>
            <Button onClick={exportData} variant="secondary" className="w-full">
              <span className="inline-flex items-center gap-2"><DownloadIcon size={16} /> {exported ? 'Exported' : 'Export all data (JSON)'}</span>
            </Button>
          </section>

          <section className="rounded-2xl border border-gotoap-line bg-gotoap-panel p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gotoap-ink-muted">
              <MoonIcon size={15} /> Appearance
            </h2>
            <div className="flex items-center gap-2">
              {([
                ['dark', 'Dark', <MoonIcon key="dark-icon" size={16} />],
                ['system', 'System', <MonitorIcon key="system-icon" size={16} />],
                ['light', 'Light', null],
              ] as [string, string, React.ReactNode][]).map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value as 'dark' | 'system' | 'light')}
                  className={'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ' + (theme === value ? 'bg-gotoap-accent text-white' : 'bg-gotoap-hover text-gotoap-ink-muted hover:text-gotoap-ink')}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gotoap-ink-muted">Dark is the default. Light follows the browser preference in future releases.</p>
          </section>

          <section className="rounded-2xl border border-gotoap-line bg-gotoap-panel p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gotoap-ink-muted">Language</h2>
            <select
              value={profile.language}
              onChange={(event) => updateProfile({ language: event.target.value })}
              className="h-10 w-full rounded-xl border border-gotoap-line bg-gotoap-bg px-3 text-sm text-gotoap-ink focus:outline-none"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>{language.label}</option>
              ))}
            </select>
          </section>

          <section className="rounded-2xl border border-gotoap-line bg-gotoap-panel p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gotoap-ink-muted">Notifications</h2>
            <p className="flex items-center gap-2 text-sm text-gotoap-ink-muted"><BellOffIcon size={15} /> Muted chats are marked in the chat list; in-app sound can be toggled per chat menu.</p>
          </section>

        </div>
      </div>
    </div>
  );
}


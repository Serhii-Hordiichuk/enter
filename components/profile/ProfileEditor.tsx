'use client';
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/profile/Avatar';
import { AVATAR_COLOR_IDS, useVortexStore, type AvatarColorId } from '@/lib/store/useVortexStore';
import { t } from '@/lib/i18n';

const SWATCHES: Record<AvatarColorId, [string, string]> = {
  red: ['#e17b76', '#c95b5b'], orange: ['#f5a774', '#e17b4d'], violet: ['#a695e7', '#7c68cf'],
  green: ['#7bc862', '#5aa743'], cyan: ['#6ec9cb', '#43a5a8'], blue: ['#65aadd', '#3f86c4'], pink: ['#ee7aae', '#d0548c'],
};

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function ProfileEditor({ seed, onSaved }: { seed: string; onSaved?: () => void }): React.JSX.Element {
  const profile = useVortexStore((state) => state.profile);
  const updateProfile = useVortexStore((state) => state.updateProfile);
  const setAppName = useVortexStore((state) => state.setAppName);
  const setAppLogo = useVortexStore((state) => state.setAppLogo);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [colorId, setColorId] = useState<string>(profile.avatarColor);
  const [appName, setAppNameLocal] = useState(profile.appName);
  const [saved, setSaved] = useState(false);

  const save = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    updateProfile({ displayName: displayName.trim().slice(0, 32), username: username.trim().toLowerCase().slice(0, 32), bio: bio.trim().slice(0, 140), avatarColor: colorId });
    setAppName(appName.trim() || 'Gotoap Messenger');
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
    onSaved?.();
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      alert('Image too large. Max 512KB.');
      return;
    }
    try {
      const dataUri = await readFileAsDataUri(file);
      setAppLogo(dataUri);
    } catch (err) {
      console.error('Failed to read logo:', err);
    }
  };

  const resetLogo = (): void => {
    setAppLogo(null);
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar seed={seed} name={displayName} colorId={colorId} size={64} online />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gotoap-ink">{displayName.trim() || 'Anonymous peer'}</p>
          <p className="truncate text-xs text-gotoap-ink-muted">{username ? '@' + username : 'No username'}</p>
        </div>
      </div>
      <Input label={t('profile.name')} value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={32} placeholder={t('profile.namePlaceholder')} />
      <Input label={t('profile.username')} value={username} onChange={(event) => setUsername(event.target.value)} maxLength={32} placeholder={t('profile.usernamePlaceholder')} prefix="@" />
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">{t('profile.bio')}</span>
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={140} rows={2} placeholder={t('profile.bioPlaceholder')} className="w-full rounded-xl border border-gotoap-hover bg-gotoap-panel px-3 py-2 text-sm text-gotoap-ink placeholder:text-gotoap-ink-faint focus:border-gotoap-accent focus:outline-none focus:ring-2 focus:ring-gotoap-accent/30" />
      </label>
      <div>
        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">{t('profile.avatarColor')}</span>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLOR_IDS.map((id) => {
            const [from, to] = SWATCHES[id];
            const active = colorId === id;
            return (
              <button key={id} type="button" aria-label={'Avatar color ' + id} aria-pressed={active} onClick={() => setColorId(id)} className={'h-8 w-8 rounded-full transition ' + (active ? 'ring-2 ring-gotoap-accent ring-offset-2 ring-offset-gotoap-panel' : 'hover:scale-110')}>
                <span aria-hidden="true" className="block h-full w-full rounded-full" style={{ background: 'linear-gradient(135deg, ' + from + ' 0%, ' + to + ' 100%)' }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Branding section: app name + logo */}
      <div className="rounded-xl border border-gotoap-line bg-gotoap-hover/50 p-3">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">{t('profile.branding')}</p>
        <p className="mb-3 text-xs text-gotoap-ink-faint">{t('profile.brandingHint')}</p>
        <Input label={t('profile.appName')} value={appName} onChange={(event) => setAppNameLocal(event.target.value)} maxLength={40} placeholder={t('profile.appNamePlaceholder')} />
        <div className="mt-3 flex items-center gap-3">
          {profile.appLogo ? (
            <img src={profile.appLogo} alt="App logo" className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gotoap-accent/15 text-xs text-gotoap-accent">Logo</span>
          )}
          <label className="cursor-pointer rounded-lg bg-gotoap-panel px-3 py-1.5 text-xs font-medium text-gotoap-ink transition hover:bg-gotoap-hover">
            {t('profile.appLogoUpload')}
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
          {profile.appLogo ? (
            <button type="button" onClick={resetLogo} className="rounded-lg px-3 py-1.5 text-xs text-gotoap-ink-muted transition hover:text-red-400">
              {t('profile.appLogoReset')}
            </button>
          ) : null}
        </div>
      </div>

      <Button type="submit" className="w-full">{saved ? t('profile.saved') : t('profile.save')}</Button>
    </form>
  );
}

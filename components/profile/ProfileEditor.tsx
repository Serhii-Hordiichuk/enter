'use client';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/profile/Avatar';
import { AVATAR_COLOR_IDS, useVortexStore, type AvatarColorId } from '@/lib/store/useVortexStore';

const SWATCHES: Record<AvatarColorId, [string, string]> = {
  red: ['#e17b76', '#c95b5b'], orange: ['#f5a774', '#e17b4d'], violet: ['#a695e7', '#7c68cf'],
  green: ['#7bc862', '#5aa743'], cyan: ['#6ec9cb', '#43a5a8'], blue: ['#65aadd', '#3f86c4'], pink: ['#ee7aae', '#d0548c'],
};

export function ProfileEditor({ seed, onSaved }: { seed: string; onSaved?: () => void }): React.JSX.Element {
  const profile = useVortexStore((state) => state.profile);
  const updateProfile = useVortexStore((state) => state.updateProfile);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [colorId, setColorId] = useState<string>(profile.avatarColor);
  const [saved, setSaved] = useState(false);

  const save = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    updateProfile({ displayName: displayName.trim().slice(0, 32), username: username.trim().toLowerCase().slice(0, 32), bio: bio.trim().slice(0, 140), avatarColor: colorId });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
    onSaved?.();
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
      <Input label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={32} placeholder="How peers will see you" />
      <Input label="Username" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={32} placeholder="your_nick" prefix="@" />
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">Bio</span>
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={140} rows={2} placeholder="A few words about you" className="w-full rounded-xl border border-gotoap-hover bg-gotoap-panel px-3 py-2 text-sm text-gotoap-ink placeholder:text-gotoap-ink-faint focus:border-gotoap-accent focus:outline-none focus:ring-2 focus:ring-gotoap-accent/30" />
      </label>
      <div>
        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">Avatar color</span>
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
      <Button type="submit" className="w-full">{saved ? 'Saved' : 'Save profile'}</Button>
    </form>
  );
}

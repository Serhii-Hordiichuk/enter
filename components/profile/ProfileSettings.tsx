'use client';

/** Full profile settings: personal info, privacy, sessions, 2FA, data export, delete account. */
import { useState, type FormEvent } from 'react';
import { Avatar } from '@/components/profile/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { t } from '@/lib/i18n';
import {
  CameraIcon, ChevronRightIcon, ClockIcon, ExportIcon, KeyIcon, LockIcon, PaletteIcon, PhoneIcon, ShieldIcon, TrashIcon, UserIcon,
} from '@/components/icons';
import type { PrivacySettings } from '@/lib/store/useVortexStore';
import { exportAllData } from '@/lib/messaging/messenger';

type Section = 'main' | 'personal' | 'privacy' | 'sessions' | '2fa' | 'data' | 'danger';

export function ProfileSettings({ onBack }: { onBack: () => void }): React.JSX.Element {
  const profile = useVortexStore((state) => state.profile);
  const currentDid = useVortexStore((state) => state.currentDid);
  const updateProfile = useVortexStore((state) => state.updateProfile);
  const [section, setSection] = useState<Section>('main');
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [website, setWebsite] = useState(profile.website);
  const [location, setLocation] = useState(profile.location);
  const [birthday, setBirthday] = useState(profile.birthday);
  const [language, setLanguage] = useState(profile.language);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const colors: { id: string; from: string; to: string }[] = [
    { id: 'red', from: '#e17b76', to: '#c95b5b' },
    { id: 'orange', from: '#f5a774', to: '#e17b4d' },
    { id: 'violet', from: '#a695e7', to: '#7c68cf' },
    { id: 'green', from: '#7bc862', to: '#5aa743' },
    { id: 'cyan', from: '#6ec9cb', to: '#43a5a8' },
    { id: 'blue', from: '#65aadd', to: '#3f86c4' },
    { id: 'pink', from: '#ee7aae', to: '#d0548c' },
  ];

  const save = (e: FormEvent): void => {
    e.preventDefault();
    updateProfile({ displayName: displayName.trim(), username: username.trim().toLowerCase(), bio: bio.trim().slice(0, 140), phone: phone.trim(), email: email.trim(), website: website.trim(), location: location.trim(), birthday, language, timezone, avatarColor });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  const updatePrivacy = (key: keyof PrivacySettings, value: PrivacySettings[keyof PrivacySettings]): void => {
    updateProfile({ privacy: { ...profile.privacy, [key]: value } });
  };

  if (section !== 'main') {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gotoap-line bg-gotoap-panel px-3">
          <button type="button" onClick={() => setSection('main')} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">←</button>
          <h1 className="text-base font-semibold text-gotoap-ink">{section === 'personal' ? t('profile.personalInfo') : section === 'privacy' ? t('profile.privacySecurity') : section === 'sessions' ? t('profile.activeSessions') : section === '2fa' ? t('profile.twoFactor') : section === 'data' ? t('profile.dataStorage') : t('profile.deleteAccount')}</h1>
        </header>
        <div className="gotoap-scroll flex-1 overflow-y-auto p-4">
          {section === 'personal' ? (
            <form onSubmit={save} className="flex flex-col gap-4">
              <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={32} placeholder="Your name" />
              <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={32} placeholder="username" prefix="@" />
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">Bio</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={140} rows={3} placeholder="Tell others about yourself" className="w-full rounded-xl border border-gotoap-hover bg-gotoap-panel px-3 py-2 text-sm text-gotoap-ink placeholder:text-gotoap-ink-faint focus:border-gotoap-accent focus:outline-none focus:ring-2 focus:ring-gotoap-accent/30" />
              </label>
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" />
              <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
              <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
              <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
              <Input label="Birthday" value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="YYYY-MM-DD" />
              <Input label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" />
              <Input label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="UTC" />
              <Button type="submit" className="w-full">{saved ? 'Saved' : 'Save Changes'}</Button>
            </form>
          ) : section === 'privacy' ? (
            <div className="flex flex-col gap-2">
              <h2 className="mb-2 text-sm font-medium text-gotoap-ink-muted">Who can see my information</h2>
              <PrivacyOption icon={<ClockIcon size={16} />} label={t('privacy.lastSeen')} value={profile.privacy.lastSeen} onChange={(v) => updatePrivacy('lastSeen', v)} />
              <PrivacyOption icon={<CameraIcon size={16} />} label={t('privacy.profilePhoto')} value={profile.privacy.profilePhoto} onChange={(v) => updatePrivacy('profilePhoto', v)} />
              <PrivacyOption icon={<PhoneIcon size={16} />} label={t('privacy.phoneNumber')} value={profile.privacy.phoneNumber} onChange={(v) => updatePrivacy('phoneNumber', v)} />
              <PrivacyOption icon={<UserIcon size={16} />} label={t('privacy.forwardedMessages')} value={profile.privacy.forwardedMessages} onChange={(v) => updatePrivacy('forwardedMessages', v)} />
              <PrivacyOption icon={<PhoneIcon size={16} />} label={t('privacy.calls')} value={profile.privacy.calls} onChange={(v) => updatePrivacy('calls', v)} />
              <PrivacyOption icon={<ChevronRightIcon size={16} />} label={t('privacy.groups')} value={profile.privacy.groups} onChange={(v) => updatePrivacy('groups', v)} />
            </div>
          ) : section === 'sessions' ? (
            <div className="flex flex-col gap-2">
              {(profile.activeSessions.length ? profile.activeSessions : [{ id: 'current', device: 'This Browser', platform: 'Web', location: 'Local', lastActive: Date.now(), current: true }]).map((session) => (
                <div key={session.id} className="flex items-center gap-3 rounded-xl border border-gotoap-line bg-gotoap-panel p-3">
                  <ShieldIcon size={20} className={session.current ? 'text-gotoap-accent' : 'text-gotoap-ink-muted'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gotoap-ink">{session.device} {session.current ? '(current)' : ''}</p>
                    <p className="truncate text-xs text-gotoap-ink-faint">{session.platform} - {session.location}</p>
                  </div>
                  {!session.current ? <Button size="sm" variant="danger" onClick={() => updateProfile({ activeSessions: profile.activeSessions.filter((s) => s.id !== session.id) })}>Terminate</Button> : null}
                </div>
              ))}
              <Button variant="secondary" onClick={() => updateProfile({ activeSessions: profile.activeSessions.filter((s) => s.current) })}>Terminate All Other Sessions</Button>
            </div>
          ) : section === '2fa' ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-gotoap-line bg-gotoap-panel p-4">
                <div className="flex items-center gap-2">
                  <KeyIcon size={20} className="text-gotoap-accent" />
                  <h3 className="text-sm font-medium text-gotoap-ink">Two-Step Verification</h3>
                </div>
                <p className="mt-2 text-xs text-gotoap-ink-muted">Add an extra layer of security. When enabled, you will need your password and a code from your authenticator app to log in.</p>
                <Switch checked={profile.twoFactorEnabled} label={profile.twoFactorEnabled ? 'Enabled' : 'Disabled'} description="Require a code on new devices" onChange={(v) => updateProfile({ twoFactorEnabled: v })} />
              </div>
              <Input label="Recovery Email" value={profile.recoveryEmail} onChange={(e) => updateProfile({ recoveryEmail: e.target.value })} placeholder="recovery@example.com" type="email" />
            </div>
          ) : section === 'data' ? (
            <div className="flex flex-col gap-2">
              <Button variant="secondary" className="w-full" onClick={() => { try { exportAllData(); } catch (error) { console.error('Export failed:', error); } }}><span className="inline-flex items-center gap-2"><ExportIcon size={16} /> Export All Data (JSON)</span></Button>
              <div className="mt-2 rounded-xl border border-gotoap-line bg-gotoap-panel p-4">
                <h3 className="text-sm font-medium text-gotoap-ink">Storage Usage</h3>
                <p className="mt-1 text-xs text-gotoap-ink-muted">Messages: {Object.values(useVortexStore.getState().messages).reduce((acc, m) => acc + m.length, 0)}</p>
                <p className="text-xs text-gotoap-ink-muted">Media files: {Object.values(useVortexStore.getState().messages).reduce((acc, m) => acc + m.filter((msg) => msg.media).length, 0)}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                <h3 className="text-sm font-medium text-red-300">Delete Account</h3>
                <p className="mt-1 text-xs text-red-200/80">This will permanently delete your account, all messages, and remove you from all groups. This action cannot be undone.</p>
                <Button variant="danger" className="mt-3" onClick={() => { if (confirm('Are you sure you want to delete your account? This cannot be undone.')) { localStorage.clear(); window.location.reload(); } }}><span className="inline-flex items-center gap-2"><TrashIcon size={16} /> Delete My Account</span></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gotoap-line bg-gotoap-panel px-4">
        <button type="button" onClick={onBack} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">←</button>
        <h1 className="text-base font-semibold text-gotoap-ink">Edit Profile</h1>
      </header>
      <div className="gotoap-scroll flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 px-4 py-6">
          <div className="relative">
            <Avatar seed={currentDid?.did ?? 'gotoap'} name={displayName} size={96} online />
            <button type="button" onClick={() => setColorPickerOpen((v) => !v)} className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gotoap-accent text-white shadow-lg" aria-label={t('profile.changeColor')}><PaletteIcon size={16} /></button>
          </div>
          {colorPickerOpen ? (
            <div className="flex gap-2 rounded-xl border border-gotoap-line bg-gotoap-panel p-2 shadow-lg">
              {colors.map((c) => (
                <button key={c.id} type="button" onClick={() => { setAvatarColor(c.id); setColorPickerOpen(false); }} aria-label={c.id} className={'h-8 w-8 rounded-full ' + (avatarColor === c.id ? 'ring-2 ring-gotoap-accent ring-offset-2 ring-offset-gotoap-panel' : '')} style={{ background: 'linear-gradient(135deg, ' + c.from + ' 0%, ' + c.to + ' 100%)' }} />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 px-4 pb-6">
          <SettingsRow icon={<UserIcon size={18} />} label={t('profile.personalInfo')} subtitle="Name, username, bio" onClick={() => setSection('personal')} />
          <SettingsRow icon={<LockIcon size={18} />} label={t('profile.privacySecurity')} subtitle="Last seen, photo, calls" onClick={() => setSection('privacy')} />
          <SettingsRow icon={<ShieldIcon size={18} />} label={t('profile.activeSessions')} subtitle={(profile.activeSessions ? profile.activeSessions.length : 0) + ' ' + t('profile.devices')} onClick={() => setSection('sessions')} />
          <SettingsRow icon={<KeyIcon size={18} />} label={t('profile.twoFactor')} subtitle={profile.twoFactorEnabled ? t('profile.enabled') : t('profile.disabled')} onClick={() => setSection('2fa')} />
          <SettingsRow icon={<ExportIcon size={18} />} label={t('profile.dataStorage')} subtitle={t('profile.export') + ', ' + t('profile.cache')} onClick={() => setSection('data')} />
          <SettingsRow icon={<TrashIcon size={18} />} label={t('profile.deleteAccount')} subtitle={t('profile.irreversible')} onClick={() => setSection('danger')} danger />
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, subtitle, onClick, danger = false }: { icon: React.ReactNode; label: string; subtitle: string; onClick: () => void; danger?: boolean }): React.JSX.Element {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gotoap-hover">
      <span className={danger ? 'text-red-400' : 'text-gotoap-accent'}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={'text-sm font-medium ' + (danger ? 'text-red-400' : 'text-gotoap-ink')}>{label}</p>
        <p className="truncate text-xs text-gotoap-ink-faint">{subtitle}</p>
      </div>
      <ChevronRightIcon size={16} className="shrink-0 text-gotoap-ink-faint" />
    </button>
  );
}

function PrivacyOption({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: string; onChange: (v: 'everyone' | 'contacts' | 'nobody') => void }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gotoap-line bg-gotoap-panel px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="text-gotoap-accent">{icon}</span>
        <span className="text-sm text-gotoap-ink">{label}</span>
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value as 'everyone' | 'contacts' | 'nobody')} className="rounded-lg border border-gotoap-hover bg-gotoap-bg px-2 py-1 text-xs text-gotoap-ink focus:outline-none">
        <option value="everyone">{t('privacy.everyone')}</option>
        <option value="contacts">{t('privacy.contacts')}</option>
        <option value="nobody">{t('privacy.nobody')}</option>
      </select>
    </div>
  );
}

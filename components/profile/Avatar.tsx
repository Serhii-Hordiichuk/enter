/** Deterministic gradient avatar generated from a seed string (fully custom, no assets). */
import { AVATAR_COLOR_IDS, type AvatarColorId } from '@/lib/store/useVortexStore';

interface AvatarProps {
  seed: string;
  name?: string;
  colorId?: string;
  size?: number;
  emoji?: string;
  online?: boolean;
}

const GRADIENTS: Record<AvatarColorId, [string, string]> = {
  red: ['#e17b76', '#c95b5b'],
  orange: ['#f5a774', '#e17b4d'],
  violet: ['#a695e7', '#7c68cf'],
  green: ['#7bc862', '#5aa743'],
  cyan: ['#6ec9cb', '#43a5a8'],
  blue: ['#65aadd', '#3f86c4'],
  pink: ['#ee7aae', '#d0548c'],
};

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function resolveGradient(seed: string, colorId?: string): [string, string] {
  if (colorId && (AVATAR_COLOR_IDS as readonly string[]).includes(colorId)) {
    return GRADIENTS[colorId as AvatarColorId];
  }
  const values = Object.values(GRADIENTS);
  return values[hashSeed(seed) % values.length] as [string, string];
}

function initialsOf(name: string | undefined, seed: string): string {
  const source = (name ?? '').trim();
  if (source) {
    const parts = source.split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
  }
  const bare = seed.replace(/^did:[a-z]+:/, '').replace(/[^a-zA-Z0-9]/g, '');
  const fallback = bare.slice(0, 2) || 'G';
  return fallback.toUpperCase();
}

export function Avatar({ seed, name, colorId, size = 48, emoji, online = false }: AvatarProps): React.JSX.Element {
  const [from, to] = resolveGradient(seed, colorId);
  const fontSize = Math.max(10, Math.round(size * 0.36));
  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <div
        aria-hidden="true"
        className="flex h-full w-full items-center justify-center rounded-full text-white shadow-inner"
        style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`, fontSize }}
      >
        {emoji ? <span style={{ fontSize }}>{emoji}</span> : <span className="font-semibold leading-none">{initialsOf(name, seed)}</span>}
      </div>
      {online ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gotoap-panel bg-emerald-400" aria-label="Online" /> : null}
    </div>
  );
}

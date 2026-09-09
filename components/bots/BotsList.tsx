'use client';

/** Bots list: my bots with command counts, plus a "New bot" shortcut. */
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { BotIcon, ChevronRightIcon, PlusIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

export function BotsList({ onNewBot }: { onNewBot: () => void }): React.JSX.Element {
  const router = useRouter();
  const bots = useVortexStore((state) => state.bots);

  return (
    <div className="gotoap-scroll flex-1 overflow-y-auto px-2 pb-3" aria-label="Bots">
      {bots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gotoap-hover text-gotoap-accent">
            <BotIcon size={26} />
          </span>
          <p className="text-sm font-medium text-gotoap-ink">No bots yet</p>
          <p className="text-xs text-gotoap-ink-muted">Create a bot that responds with local AI or your API proxy.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {bots.map((bot) => (
            <button
              key={bot.id}
              type="button"
              onClick={() => router.push('/chat/' + encodeURIComponent(bot.id))}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gotoap-hover"
            >
              <Avatar seed={bot.id} name={bot.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <BotIcon size={13} className="shrink-0 text-gotoap-accent" />
                  <p className="truncate text-sm font-medium text-gotoap-ink">{bot.name}</p>
                </div>
                <p className="truncate text-xs text-gotoap-ink-faint">@{bot.username} · {bot.commands.length} commands</p>
              </div>
              <ChevronRightIcon size={16} className="shrink-0 text-gotoap-ink-faint" />
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onNewBot}
        className="mx-auto mt-3 flex items-center gap-2 rounded-xl bg-gotoap-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-gotoap-accent-hover"
      >
        <PlusIcon size={16} /> New Bot
      </button>
    </div>
  );
}
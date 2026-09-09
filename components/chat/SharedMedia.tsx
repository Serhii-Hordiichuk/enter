'use client';

/** Shared media panel: photos, videos, files, links — like Telegram. */
import { useState } from 'react';
import type { VortexMessage } from '@/lib/store/useVortexStore';
import { FileIcon, ImageIcon } from '@/components/icons';

interface SharedMediaProps {
  messages: VortexMessage[];
}

type Tab = 'photos' | 'videos' | 'files' | 'links';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'photos', label: 'Photos', icon: <ImageIcon size={16} /> },
  { id: 'videos', label: 'Videos', icon: <FileIcon size={16} /> },
  { id: 'files', label: 'Files', icon: <FileIcon size={16} /> },
  { id: 'links', label: 'Links', icon: <FileIcon size={16} /> },
];

function extractLinks(text: string): string[] {
  try {
    const regex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const matches = text.match(regex);
    return matches ? Array.from(new Set(matches)) : [];
  } catch {
    return [];
  }
}

export function SharedMedia({ messages }: SharedMediaProps): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('photos');

  const mediaMessages = messages.filter((m) => !m.deletedAt && m.kind === 'file' && m.media);
  const photos = mediaMessages.filter((m) => m.media!.mime.startsWith('image/'));
  const videos = mediaMessages.filter((m) => m.media!.mime.startsWith('video/'));
  const files = mediaMessages.filter((m) => !m.media!.mime.startsWith('image/') && !m.media!.mime.startsWith('video/'));
  const links = messages
    .filter((m) => !m.deletedAt && m.kind === 'text')
    .flatMap((m) => extractLinks(m.body));

  const items =
    tab === 'photos' ? photos : tab === 'videos' ? videos : tab === 'files' ? files : [];

  return (
    <div className="flex h-full flex-col">
      <nav className="flex border-b border-gotoap-line">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium ${
              tab === tabItem.id
                ? 'border-b-2 border-gotoap-accent text-gotoap-accent'
                : 'text-gotoap-ink-muted hover:text-gotoap-ink'
            }`}
          >
            {tabItem.icon}
            {tabItem.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'links' ? (
          links.length === 0 ? (
            <p className="text-sm text-gotoap-ink-faint">No links found.</p>
          ) : (
            <ul className="space-y-1.5">
              {links.map((link, i) => (
                <li key={i}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sky-400 hover:underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          )
        ) : items.length === 0 ? (
          <p className="text-sm text-gotoap-ink-faint">No {tab.slice(0, -1)} found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((m) => (
              <div
                key={m.id}
                className={`relative rounded-lg bg-gotoap-hover ${
                  tab === 'photos' ? 'aspect-square' : 'aspect-video'
                }`}
              >
                {m.media!.mime.startsWith('image/') ? (
                  <img
                    src={m.media!.dataUri}
                    alt={m.media!.name}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : m.media!.mime.startsWith('video/') ? (
                  <video
                    src={m.media!.dataUri}
                    className="h-full w-full rounded-lg object-cover"
                    poster={m.media!.dataUri}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileIcon size={24} className="text-gotoap-accent" />
                  </div>
                )}
                <span className="mt-1 block truncate text-[11px] text-gotoap-ink-muted">
                  {m.media!.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
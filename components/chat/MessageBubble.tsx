'use client';

/** A single chat message bubble with media, replies, and the message action menu. */
import { useState } from 'react';
import { Avatar } from '@/components/profile/Avatar';
import { Menu } from '@/components/ui/Menu';
import { VoiceNote } from '@/components/chat/VoiceNote';
import { stickerById } from '@/components/chat/StickerPicker';
import {
  CheckIcon, DoubleCheckIcon, DownloadIcon, EditIcon, FileIcon, ForwardIcon, LockIcon, PinIcon, ReplyIcon, TrashIcon,
} from '@/components/icons';
import type { VortexMessage } from '@/lib/store/useVortexStore';

export type MessageActionKind = 'reply' | 'copy' | 'forward' | 'edit' | 'delete' | 'pin';

interface MessageBubbleProps {
  message: VortexMessage;
  replyTo: VortexMessage | null;
  query?: string;
  onAction: (action: MessageActionKind, message: VortexMessage) => void;
}

function shortDid(did: string): string {
  return did.length > 14 ? did.slice(0, 11) + '...' : did;
}

/** Splits the body by the search query and highlights matches. */
function highlight(body: string, query: string | undefined): React.ReactNode {
  if (!query || query.trim().length === 0 || !body) return body;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const parts = body.split(new RegExp('(' + escaped + ')', 'ig'));
    return parts.map((part, index) => (
      part.toLowerCase() === query.trim().toLowerCase()
        ? <mark key={index} className="rounded bg-gotoap-accent/50 px-0.5 text-white">{part}</mark>
        : <span key={index}>{part}</span>
    ));
  } catch {
    return body;
  }
}

function formatBytes(size: number): string {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

export function MessageBubble({ message, replyTo, query, onAction }: MessageBubbleProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const mine = message.mine;
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const sticker = message.kind === 'sticker' ? stickerById(message.body.replace(/^sticker:/, '')) : null;
  const isImage = message.kind === 'file' && (message.media?.mime ?? '').startsWith('image/');
  const downloadName = message.media?.name ?? 'gotoap-attachment';

  const downloadMedia = (): void => {
    try {
      if (!message.media) return;
      const link = document.createElement('a');
      link.href = message.media.dataUri;
      link.download = downloadName;
      link.click();
    } catch (error) {
      console.error('Failed to download the attachment:', error);
    }
  };

  const menuItems = [
    { label: 'Reply', icon: <ReplyIcon size={16} />, onSelect: () => onAction('reply', message) },
    { label: 'Copy text', icon: <CheckIcon size={16} />, onSelect: () => onAction('copy', message) },
    { label: 'Forward', icon: <ForwardIcon size={16} />, onSelect: () => onAction('forward', message) },
    ...(mine && message.kind === 'text' && !message.deletedAt ? [{ label: 'Edit', icon: <EditIcon size={16} />, onSelect: () => onAction('edit', message) }] : []),
    ...(message.body ? [{ label: 'Pin message', icon: <PinIcon size={16} />, onSelect: () => onAction('pin', message) }] : []),
    ...(mine && !message.deletedAt ? [{ label: 'Delete', icon: <TrashIcon size={16} />, danger: true, onSelect: () => onAction('delete', message) }] : []),
  ];

  const footer = (
    <footer className={'mt-0.5 flex items-center justify-end gap-1 text-[11px] ' + (mine ? 'text-white/60' : 'text-gotoap-ink-faint')}>
      {message.editedAt ? <span>edited</span> : null}
      {message.encrypted ? <span title="Encrypted with AES-GCM"><LockIcon size={11} /></span> : null}
      <time dateTime={new Date(message.timestamp).toISOString()}>{time}</time>
      {mine ? (message.viewed ? <DoubleCheckIcon size={13} className="text-sky-300" /> : <DoubleCheckIcon size={13} className="text-white/70" />) : null}
    </footer>
  );

  return (
    <article className={'group relative flex items-end gap-2 ' + (mine ? 'justify-end' : 'justify-start')}>
      {!mine ? <Avatar seed={message.senderDid} size={28} /> : null}
      <div className={'relative max-w-[78%] ' + (sticker ? '' : 'rounded-2xl shadow-md shadow-black/20 ' + (mine ? 'rounded-br-md bg-gotoap-bubble-out text-white' : 'rounded-bl-md bg-gotoap-bubble-in text-gotoap-ink'))}>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          onContextMenu={(event) => { event.preventDefault(); setMenuOpen(true); }}
          aria-label="Message actions"
          aria-expanded={menuOpen}
          className={'block w-full text-left ' + (sticker ? 'p-1' : 'px-3 py-1.5')}
        >
          {!mine && !sticker ? <p className="mb-0.5 text-xs font-semibold text-gotoap-accent-muted">{shortDid(message.senderDid)}</p> : null}
          {message.forwarded && !sticker ? <p className="mb-0.5 flex items-center gap-1 text-[11px] italic text-gotoap-accent-muted"><ForwardIcon size={11} /> Forwarded</p> : null}
          {replyTo && !sticker ? (
            <blockquote className="mb-1 border-l-2 border-gotoap-accent/70 bg-black/10 px-2 py-1 text-[13px] leading-snug">
              <span className="block font-semibold text-gotoap-accent-muted">{mine ? 'You' : shortDid(replyTo.senderDid)}</span>
              <span className="line-clamp-2 opacity-80">{replyTo.deletedAt ? 'Message deleted' : replyTo.body.slice(0, 120)}</span>
            </blockquote>
          ) : null}
          {message.deletedAt ? (
            <p className="text-[14px] italic opacity-60">This message was deleted</p>
          ) : sticker ? (
            <span title={sticker.id} className="block text-gotoap-accent"><sticker.Component size={88} /></span>
          ) : message.kind === 'voice' && message.media ? (
            <VoiceNote media={message.media} outgoing={mine} />
          ) : isImage && message.media ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URIs are already inlined; next/image adds no value here
            <img src={message.media.dataUri} alt={message.media.name} className="max-h-72 w-full rounded-xl object-cover" />
          ) : message.kind === 'file' && message.media ? (
            <div className="flex min-w-[180px] items-center gap-2.5 py-1">
              <span className={'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' + (mine ? 'bg-white/20 text-white' : 'bg-gotoap-accent/20 text-gotoap-accent')}>
                <FileIcon size={17} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{message.media.name}</p>
                <p className={'text-[11px] ' + (mine ? 'text-white/70' : 'text-gotoap-ink-muted')}>{formatBytes(message.media.size)}</p>
              </div>
              <button
                type="button"
                onClick={downloadMedia}
                aria-label="Download the attachment"
                className={'ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full ' + (mine ? 'text-white/80 hover:bg-white/15' : 'text-gotoap-ink-muted hover:bg-gotoap-hover')}
              >
                <DownloadIcon size={16} />
              </button>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{highlight(message.body, query)}</p>
          )}
          {sticker ? (
            <footer className="flex items-center justify-end gap-1 text-[11px] text-white/70">
              <time dateTime={new Date(message.timestamp).toISOString()}>{time}</time>
              {mine ? (message.viewed ? <DoubleCheckIcon size={12} className="text-sky-300" /> : <DoubleCheckIcon size={12} />) : null}
            </footer>
          ) : footer}
        </button>
        <Menu open={menuOpen} items={menuItems} onClose={() => setMenuOpen(false)} />
      </div>
    </article>
  );
}

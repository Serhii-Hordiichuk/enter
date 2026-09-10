'use client';

/** Composer: text, emoji, stickers, attachments, voice notes, reply and edit. */
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { StickerPicker } from '@/components/chat/StickerPicker';
import { Menu } from '@/components/ui/Menu';
import { CloseIcon, ClipIcon, EditIcon, FileIcon, ImageIcon, MicIcon, ReplyIcon, SendIcon, TrashIcon } from '@/components/icons';
import type { VortexMessage } from '@/lib/store/useVortexStore';
import { t } from '@/lib/i18n';

interface MessageInputProps {
  onSendText: (body: string, replyToId: string | null) => void;
  onSendSticker: (stickerId: string) => void;
  onSendVoice: (dataUri: string, durationMs: number) => void;
  onSendFile: (name: string, mime: string, dataUri: string, size: number) => void;
  onEditSave: (messageId: string, body: string) => void;
  onTyping: () => void;
  replyTo: VortexMessage | null;
  editing: VortexMessage | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
}

const MAX_FILE_BYTES = 512 * 1024;

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read the file'));
    reader.readAsDataURL(file);
  });
}

export function MessageInput(props: MessageInputProps): React.JSX.Element {
  const { onSendText, onSendSticker, onSendVoice, onSendFile, onEditSave, onTyping, replyTo, editing, onCancelReply, onCancelEdit } = props;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef(0);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [sendOnEnter, setSendOnEnter] = useState(true);
  const [hasText, setHasText] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('gotoap.sendOnEnter');
    if (stored !== null) setSendOnEnter(stored === '1');
  }, []);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.value = editing.body;
      textareaRef.current.focus();
    }
  }, [editing]);

  const autoGrow = (): void => {
    const area = textareaRef.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = Math.min(area.scrollHeight, 140) + 'px';
  };

  const notifyTyping = (): void => {
    autoGrow();
    setHasText(Boolean(textareaRef.current && textareaRef.current.value.trim()));
    onTyping();
  };

  const submitText = (): void => {
    const area = textareaRef.current;
    if (!area) return;
    const body = area.value.trim();
    if (editing) {
      if (body) onEditSave(editing.id, body);
      area.value = '';
      autoGrow();
      return;
    }
    if (!body) return;
    onSendText(body, replyTo?.id ?? null);
    area.value = '';
    setHasText(false);
    autoGrow();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey && sendOnEnter) {
      event.preventDefault();
      submitText();
    }
  };

  const pickFile = (kind: 'any' | 'image'): void => {
    const input = kind === 'image' ? imageInputRef.current : fileInputRef.current;
    if (input) input.click();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('The file is larger than 512 KB');
      const dataUri = await readFileAsDataUri(file);
      onSendFile(file.name, file.type || 'application/octet-stream', dataUri, file.size);
    } catch (error) {
      console.error('Failed to attach the file:', error);
      window.alert(error instanceof Error ? error.message : 'Failed to attach the file');
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const durationMs = Date.now() - recordStartRef.current;
        if (blob.size > 0 && durationMs > 400) {
          const reader = new FileReader();
          reader.onload = () => onSendVoice(String(reader.result), durationMs);
          reader.readAsDataURL(blob);
        }
      };
      recordStartRef.current = Date.now();
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);
    } catch (error) {
      console.error('Microphone access failed:', error);
      window.alert('The microphone is unavailable. Check the browser permissions.');
    }
  };

  const stopRecording = (discard: boolean): void => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (discard) chunksRef.current = [];
    try { recorder.stop(); } catch (error) { console.error('Failed to stop the recorder:', error); }
    recorderRef.current = null;
    setRecording(false);
  };

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setRecordSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  return (
    <div className="shrink-0 border-t border-gotoap-line bg-gotoap-panel px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-3">
      {replyTo ? (
        <div className="mx-auto mb-1.5 flex max-w-3xl items-center gap-2 rounded-xl bg-gotoap-hover/70 px-3 py-1.5">
          <ReplyIcon size={14} className="shrink-0 text-gotoap-accent" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-gotoap-ink-muted">{replyTo.body || replyTo.kind}</span>
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply" className="rounded-full p-1 text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">
            <CloseIcon size={14} />
          </button>
        </div>
      ) : null}
      {editing ? (
        <div className="mx-auto mb-1.5 flex max-w-3xl items-center gap-2 rounded-xl bg-gotoap-hover/70 px-3 py-1.5">
          <EditIcon size={14} className="shrink-0 text-gotoap-accent" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-gotoap-ink-muted">{t('chat.editing')}</span>
          <button type="button" onClick={onCancelEdit} aria-label={t('chat.cancelEdit')} className="rounded-full p-1 text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">
            <CloseIcon size={14} />
          </button>
        </div>
      ) : null}
      {recording ? (
        <div className="mx-auto mb-1.5 flex max-w-3xl items-center gap-2 rounded-xl bg-gotoap-hover/70 px-3 py-1.5 text-[13px] text-gotoap-ink">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {t('chat.recording', { seconds: recordSeconds })}
          <span className="flex-1" />
          <button type="button" onClick={() => stopRecording(true)} aria-label={t('chat.cancelRecording')} className="rounded-full p-1 text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">
            <TrashIcon size={14} />
          </button>
        </div>
      ) : null}
      <div className="mx-auto flex max-w-3xl items-end gap-1">
        <EmojiPicker onPick={(emoji) => {
          const area = textareaRef.current;
          if (area) {
            area.value += emoji;
            area.focus();
            autoGrow();
          }
        }} />
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={t('chat.messagePlaceholder')}
          aria-label={t('chat.message')}
          onChange={notifyTyping}
          onKeyDown={handleKeyDown}
          className="gotoap-textarea max-h-[140px] min-h-[40px] flex-1 rounded-2xl bg-gotoap-hover px-3 py-2.5 text-[15px] text-gotoap-ink placeholder:text-gotoap-ink-muted focus:outline-none"
        />
        <StickerPicker onPick={onSendSticker} />
        <div className="relative">
          <button type="button" onClick={() => setAttachOpen((value) => !value)} aria-label={t('chat.attachFile')} aria-expanded={attachOpen} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
            <ClipIcon size={20} />
          </button>
          <Menu
            open={attachOpen}
            align="right"
            onClose={() => setAttachOpen(false)}
            items={[
              { label: t('chat.photoOrVideo'), icon: <ImageIcon size={16} />, onSelect: () => pickFile('image') },
              { label: t('chat.document'), icon: <FileIcon size={16} />, onSelect: () => pickFile('any') },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => { const area = textareaRef.current; if (area && area.value.trim()) submitText(); else void startRecording(); }}
          aria-label={hasText ? t('chat.sendMessage') : t('chat.voiceMessage')}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gotoap-accent text-white transition hover:bg-gotoap-accent-hover"
        >
          {hasText ? <SendIcon size={19} /> : <MicIcon size={19} />}
        </button>
      </div>
      <input ref={fileInputRef} type="file" onChange={(event) => void handleFile(event)} className="hidden" aria-hidden="true" />
      <input ref={imageInputRef} type="file" accept="image/*,video/*" onChange={(event) => void handleFile(event)} className="hidden" aria-hidden="true" />
    </div>
  );
}

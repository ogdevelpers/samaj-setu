'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

async function shrink(file: File, max: number, quality: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('compress failed'))), 'image/jpeg', quality));
}

export function PhotoUploader({ albumId, labels }: { albumId: string; labels: { pick: string; busy: string; done: string } }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    const sb = createClient();
    let n = 0;
    for (const f of files) {
      setMsg(`${labels.busy} ${++n}/${files.length}`);
      try {
        const id = crypto.randomUUID();
        const [full, thumb] = await Promise.all([shrink(f, 1600, 0.8), shrink(f, 420, 0.7)]);
        const path = `${albumId}/${id}.jpg`;
        const thumbPath = `${albumId}/t_${id}.jpg`;
        const a = await sb.storage.from('gallery').upload(path, full, { contentType: 'image/jpeg' });
        const b = await sb.storage.from('gallery').upload(thumbPath, thumb, { contentType: 'image/jpeg' });
        if (a.error || b.error) throw new Error((a.error ?? b.error)!.message);
        const ins = await sb.from('photos').insert({ album_id: albumId, path, thumb_path: thumbPath });
        if (ins.error) throw new Error(ins.error.message);
      } catch (err) {
        setMsg(String((err as Error).message));
        setBusy(false);
        return;
      }
    }
    setMsg(`${labels.done}: ${files.length}`);
    setBusy(false);
    if (input.current) input.current.value = '';
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="btn-gold btn cursor-pointer">
        {labels.pick}
        <input ref={input} type="file" accept="image/*" multiple hidden disabled={busy} onChange={onPick} />
      </label>
      {msg && <span role="status" className="text-sm text-muted">{msg}</span>}
    </div>
  );
}

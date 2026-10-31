'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Compresses a payment screenshot in the browser and uploads it; the form submits only the file path. */
export function ShotInput({ userId, label, okLabel }: { userId: string; label: string; okLabel: string }) {
  const [path, setPath] = useState('');
  const [msg, setMsg] = useState('');

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMsg('…');
    try {
      const bmp = await createImageBitmap(f);
      const s = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * s);
      c.height = Math.round(bmp.height * s);
      c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
      const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.75));
      const p = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient().storage.from('payments').upload(p, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      setPath(p);
      setMsg(okLabel);
    } catch (err) {
      setMsg(String((err as Error).message));
    }
  }

  return (
    <div className="field">
      <span className="flabel">{label}</span>
      <input type="file" accept="image/*" onChange={onPick} className="input" />
      <input type="hidden" name="screenshot" value={path} />
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </div>
  );
}

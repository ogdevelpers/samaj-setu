'use client';
import { useEffect, useState } from 'react';

/** A message that slides in at the bottom, then removes itself and cleans the address bar. */
export function Flash({ ok, err }: { ok?: string; err?: string }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    setShown(true);
    if (!ok && !err) return;
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('ok');
      u.searchParams.delete('err');
      window.history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    } catch {}
    const id = setTimeout(() => setShown(false), err ? 9000 : 4500);
    return () => clearTimeout(id);
  }, [ok, err]);
  if (!shown || (!ok && !err)) return null;
  return (
    <div
      role={err ? 'alert' : 'status'}
      className={`rise fixed inset-x-4 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 font-semibold shadow-lg md:bottom-6 ${err ? 'border-bad bg-bad-soft text-bad' : 'border-good bg-good-soft text-good'}`}
    >
      <span aria-hidden>{err ? '⚠' : '✓'}</span>
      <span className="min-w-0 flex-1 break-words">{err || ok}</span>
      <button onClick={() => setShown(false)} aria-label="Close" className="px-1 opacity-70">✕</button>
    </div>
  );
}

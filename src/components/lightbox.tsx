'use client';
import { useCallback, useEffect, useState } from 'react';

export type Photo = { id: string; thumb: string; full: string; remove?: React.ReactNode };

/** Photo grid. Tap a photo to view it large; arrow keys, swipe buttons and Escape work. */
export function Lightbox({ photos, closeLabel }: { photos: Photo[]; closeLabel: string }) {
  const [at, setAt] = useState<number | null>(null);
  const go = useCallback((d: number) => setAt((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);
  useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAt(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [at, go]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <div key={p.id} className="relative">
            <button onClick={() => setAt(i)} className="block w-full overflow-hidden rounded-xl border border-line">
              <img src={p.thumb} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition hover:scale-105" />
            </button>
            {p.remove && <div className="absolute right-1 top-1">{p.remove}</div>}
          </div>
        ))}
      </div>
      {at !== null && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between p-3 text-white">
            <span className="tabular-nums text-sm opacity-80">{at + 1} / {photos.length}</span>
            <button onClick={() => setAt(null)} className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold" aria-label={closeLabel}>✕ {closeLabel}</button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
            <img src={photos[at].full} alt="" className="max-h-full max-w-full object-contain" />
            {photos.length > 1 && (
              <>
                <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/20 text-2xl text-white">‹</button>
                <button onClick={() => go(1)} aria-label="Next" className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/20 text-2xl text-white">›</button>
              </>
            )}
          </div>
          <a href={photos[at].full} target="_blank" rel="noreferrer" className="p-3 text-center text-sm text-white/80 underline">Open original</a>
        </div>
      )}
    </>
  );
}

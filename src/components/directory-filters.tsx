'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Icon } from './icon';

type Ch = { state: string; district: string; area: string };

/** Filters apply as you type or choose; no Search button needed. */
export function DirectoryFilters({ chapters, labels }: { chapters: Ch[]; labels: { search: string; state: string; district: string; area: string; all: string; clear: string } }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const state = sp.get('state') ?? '';
  const district = sp.get('district') ?? '';
  const area = sp.get('area') ?? '';

  function push(next: Record<string, string>) {
    const p = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    start(() => router.replace(`${path}?${p.toString()}`, { scroll: false }));
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  const states = [...new Set(chapters.map((c) => c.state))];
  const districts = [...new Set(chapters.filter((c) => !state || c.state === state).map((c) => c.district))];
  const areas = [...new Set(chapters.filter((c) => (!state || c.state === state) && (!district || c.district === district)).map((c) => c.area))];
  const active = !!(q || state || district || area);

  return (
    <div className="card flex flex-col gap-3">
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input aria-label={labels.search} placeholder={labels.search} className="input !pl-10" value={q}
          onChange={(e) => { setQ(e.target.value); clearTimeout(timer.current); timer.current = setTimeout(() => push({ q: e.target.value.trim() }), 300); }} />
        {pending && <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-brand border-t-transparent" />}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select aria-label={labels.state} className="input" value={state} onChange={(e) => push({ state: e.target.value, district: '', area: '' })}>
          <option value="">{labels.state}: {labels.all}</option>{states.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label={labels.district} className="input" value={district} onChange={(e) => push({ district: e.target.value, area: '' })}>
          <option value="">{labels.district}: {labels.all}</option>{districts.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label={labels.area} className="input" value={area} onChange={(e) => push({ area: e.target.value })}>
          <option value="">{labels.area}: {labels.all}</option>{areas.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {active && <button className="btn-alt btn btn-sm w-fit" onClick={() => { setQ(''); start(() => router.replace(path, { scroll: false })); }}>✕ {labels.clear}</button>}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type Tab = { href: string; label: string; badge?: number };
export type TabGroup = { match: string[]; tabs: Tab[] };

/** A row of tabs that appears on every page of a group, so a section has one entry in the menu. */
export function SubTabs({ groups }: { groups: TabGroup[] }) {
  const path = usePathname();
  const g = groups.find((x) => x.match.some((m) => path === m || path.startsWith(m + '/')));
  if (!g || g.tabs.length < 2) return null;
  return (
    <div role="tablist" className="no-print -mt-1 flex gap-1 overflow-x-auto rounded-2xl bg-surface2 p-1">
      {g.tabs.map((tb) => {
        const on = path === tb.href || path.startsWith(tb.href + '/');
        return (
          <Link key={tb.href} role="tab" aria-selected={on} href={tb.href}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[0.92rem] font-semibold transition ${on ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
            {tb.label}
            {!!tb.badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[0.7rem] font-bold text-accent-ink">{tb.badge}</span>}
          </Link>
        );
      })}
    </div>
  );
}

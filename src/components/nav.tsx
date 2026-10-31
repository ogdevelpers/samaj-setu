'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = { href: string; label: string; icon: string };

const ICONS: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  cal: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  img: 'M3 4h18v16H3zM9 10a2 2 0 100-4 2 2 0 000 4zM21 16l-5-5-8 8',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-4 3-6 7-6s7 2 7 6M17 5a3.5 3.5 0 010 7M22 20c0-3-2-5-5-5.5',
  family: 'M12 12a3 3 0 100-6 3 3 0 000 6zM5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2',
  tree: 'M12 7.5V12M5 16.5V12h14v4.5M12 5m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M5 19m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M19 19m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0',
  rupee: 'M7 5h11M7 10h11M7 5c6 0 6 9-1 9l8 6',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z',
  book: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
};

export function Nav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="no-print flex gap-1 overflow-x-auto border-b border-line pb-1.5 md:sticky md:top-3 md:flex-col md:overflow-visible md:border-0 md:pb-0">
      {items.map((i) => {
        const on = i.href === '/' ? path === '/' : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-none items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 font-medium ${on ? 'bg-brand text-brand-ink' : 'text-muted hover:bg-surface hover:text-ink'}`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] flex-none" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS[i.icon] ?? ICONS.home} />
            </svg>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

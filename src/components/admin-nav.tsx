'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';

export type AdminItem = { href: string; label: string; icon: string; badge?: number };

export function AdminNav({ items }: { items: AdminItem[] }) {
  const path = usePathname();
  const on = (h: string) => (h === '/admin' ? path === '/admin' : path === h || path.startsWith(h + '/'));
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto pb-1 md:sticky md:top-4 md:flex-col md:overflow-visible md:pb-0">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={on(i.href) ? 'page' : undefined}
          className={`flex flex-none items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 font-medium transition ${on(i.href) ? 'bg-brand text-brand-ink shadow-sm' : 'text-muted hover:bg-surface hover:text-ink'}`}>
          <Icon name={i.icon} />
          <span className="flex-1">{i.label}</span>
          {!!i.badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[0.7rem] font-bold text-accent-ink">{i.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}

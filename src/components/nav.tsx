'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from './icon';

export type NavItem = { href: string; label: string; icon: string; primary?: boolean };

const isOn = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

export function Nav({ items, moreLabel, closeLabel }: { items: NavItem[]; moreLabel: string; closeLabel: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const primary = items.filter((i) => i.primary).slice(0, 4);
  const rest = items.filter((i) => !primary.includes(i));
  const moreOn = rest.some((i) => isOn(path, i.href));

  return (
    <>
      {/* desktop sidebar */}
      <nav aria-label="Main" className="no-print sticky top-4 hidden flex-col gap-1 self-start md:flex">
        {items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={isOn(path, i.href) ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-medium transition ${isOn(path, i.href) ? 'bg-brand text-brand-ink shadow-sm' : 'text-muted hover:bg-surface hover:text-ink'}`}>
            <Icon name={i.icon} />{i.label}
          </Link>
        ))}
      </nav>

      {/* phone tab bar */}
      <nav aria-label="Main" className="no-print safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface md:hidden">
        {primary.map((i) => (
          <Link key={i.href} href={i.href} aria-current={isOn(path, i.href) ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[0.7rem] font-semibold ${isOn(path, i.href) ? 'text-brand' : 'text-muted'}`}>
            <span className={`grid h-7 w-12 place-items-center rounded-full ${isOn(path, i.href) ? 'bg-brand-soft' : ''}`}><Icon name={i.icon} className="h-[22px] w-[22px]" /></span>
            <span className="max-w-full truncate">{i.label}</span>
          </Link>
        ))}
        <button onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
          className={`flex flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[0.7rem] font-semibold ${moreOn ? 'text-brand' : 'text-muted'}`}>
          <span className={`grid h-7 w-12 place-items-center rounded-full ${moreOn ? 'bg-brand-soft' : ''}`}><Icon name="more" className="h-[22px] w-[22px]" /></span>
          {moreLabel}
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={moreLabel}>
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label={closeLabel} />
          <div className="rise safe-bottom absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-4 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line2" />
            <div className="grid grid-cols-3 gap-2">
              {rest.map((i) => (
                <Link key={i.href} href={i.href}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center text-sm font-semibold ${isOn(path, i.href) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink'}`}>
                  <Icon name={i.icon} className="h-6 w-6" />{i.label}
                </Link>
              ))}
            </div>
            <button onClick={() => setOpen(false)} className="btn-alt btn mt-3 w-full">{closeLabel}</button>
          </div>
        </div>
      )}
    </>
  );
}

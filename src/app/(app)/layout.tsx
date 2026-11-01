import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { Nav, type NavItem } from '@/components/nav';
import { LangToggle } from '@/components/lang-toggle';
import { Icon } from '@/components/icon';
import { signOut } from '../actions';
import { ORG_EN, ORG_HI } from '@/lib/utils';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const c = await getCtx();
  const { t } = c;
  const items: NavItem[] = [{ href: '/', label: t('Home', 'मुख्य'), icon: 'home', primary: true }];
  if (c.isMember) {
    items.push(
      { href: '/events', label: t('Events', 'कार्यक्रम'), icon: 'cal', primary: true },
      { href: '/gallery', label: t('Gallery', 'गैलरी'), icon: 'img' },
      { href: '/directory', label: t('Directory', 'सदस्य सूची'), icon: 'users' },
    );
  }
  items.push({ href: c.household ? '/family' : '/register', label: c.household ? t('My family', 'मेरा परिवार') : t('Register family', 'पंजीकरण'), icon: 'family', primary: !c.isMember });
  if (c.isMember) {
    items.push(
      { href: '/tree', label: t('Family tree', 'वंश वृक्ष'), icon: 'tree' },
      { href: '/payments', label: t('Payments', 'भुगतान'), icon: 'rupee', primary: true },
      { href: '/community', label: t('Community help', 'समाज सहयोग'), icon: 'heart' },
    );
  }
  if (c.isStaff) items.push({ href: '/admin', label: t('Admin console', 'प्रबंधन'), icon: 'shield' });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 md:pb-16">
      <header className="no-print flex items-center gap-3 py-3 md:py-4">
        <Link href="/" className="mr-auto flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-brand font-display text-base text-brand-ink">श्री</span>
          <span className="min-w-0">
            <b className="block truncate font-display text-[1.05rem] font-normal leading-tight md:text-lg">{c.lang === 'hi' ? ORG_HI : ORG_EN}</b>
            {c.household?.chapter && <span className="flex items-center gap-1 text-[0.8rem] text-muted"><Icon name="map" className="h-3.5 w-3.5" />{c.household.chapter.name ?? c.household.chapter.area}</span>}
          </span>
        </Link>
        <LangToggle next="/" />
        <Link href="/account" aria-label={t('My account', 'मेरा खाता')} className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft font-bold text-brand">
          {(c.profile?.full_name || c.user.email || '?').trim()[0]?.toUpperCase()}
        </Link>
        <form action={signOut} className="hidden sm:block">
          <button className="flex min-h-10 items-center gap-1.5 rounded-xl border border-line2 bg-surface px-3 text-sm font-semibold"><Icon name="out" className="h-4 w-4" />{t('Sign out', 'साइन आउट')}</button>
        </form>
      </header>
      <div className="grid items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
        <Nav items={items} moreLabel={t('More', 'और')} closeLabel={t('Close', 'बंद करें')} />
        <main className="rise flex min-w-0 flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}

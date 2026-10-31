import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { Nav, type NavItem } from '@/components/nav';
import { LangToggle } from '@/components/lang-toggle';
import { signOut } from '../actions';
import { ORG_EN, ORG_HI } from '@/lib/utils';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const c = await getCtx();
  const { t } = c;
  const items: NavItem[] = [{ href: '/', label: t('Home', 'मुख्य पृष्ठ'), icon: 'home' }];
  if (c.isMember) {
    items.push(
      { href: '/events', label: t('Events & notices', 'कार्यक्रम व सूचना'), icon: 'cal' },
      { href: '/gallery', label: t('Gallery', 'गैलरी'), icon: 'img' },
      { href: '/directory', label: t('Directory', 'सदस्य सूची'), icon: 'users' },
    );
  }
  items.push({ href: c.household ? '/family' : '/register', label: c.household ? t('My family', 'मेरा परिवार') : t('Register family', 'परिवार पंजीकरण'), icon: 'family' });
  if (c.isMember) {
    items.push(
      { href: '/tree', label: t('Family tree', 'वंश वृक्ष'), icon: 'tree' },
      { href: '/payments', label: t('Payments', 'भुगतान'), icon: 'rupee' },
      { href: '/community', label: t('Community help', 'समाज सहयोग'), icon: 'heart' },
    );
  }
  if (c.canMoney || c.isTreasurer) items.push({ href: '/finance', label: t('Finance', 'वित्त'), icon: 'book' });
  if (c.canPost) items.push({ href: '/admin', label: t('Admin', 'प्रबंधन'), icon: 'shield' });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16">
      <header className="no-print flex flex-wrap items-center gap-3 py-4">
        <Link href="/" className="mr-auto flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand font-display text-[0.95rem] text-brand-ink">श्री</span>
          <span className="min-w-0">
            <b className="block font-display text-lg font-normal leading-tight">{c.lang === 'hi' ? ORG_HI : ORG_EN}</b>
            {c.household?.chapter && <span className="text-[0.8rem] text-muted">{c.household.chapter.name ?? c.household.chapter.area}</span>}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle next="/" />
          <Link href="/account" className="rounded-lg border border-line2 bg-surface px-3 py-1.5 text-sm font-semibold">
            {c.profile?.full_name?.split(' ')[0] || t('Account', 'खाता')}
          </Link>
          <form action={signOut}>
            <button className="rounded-lg border border-line2 bg-surface px-3 py-1.5 text-sm font-semibold">{t('Sign out', 'साइन आउट')}</button>
          </form>
        </div>
      </header>
      <div className="grid items-start gap-4 md:grid-cols-[210px_minmax(0,1fr)] md:gap-6">
        <Nav items={items} />
        <main className="flex min-w-0 flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}

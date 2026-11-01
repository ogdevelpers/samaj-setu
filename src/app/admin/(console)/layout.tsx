import Link from 'next/link';
import { requireStaff } from '@/lib/ctx';
import { AdminNav, type AdminItem } from '@/components/admin-nav';
import { LangToggle } from '@/components/lang-toggle';
import { Icon } from '@/components/icon';
import { signOut } from '../../actions';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const c = await requireStaff();
  const { t, sb } = c;
  const [{ count: pendFam }, { count: pendPay }, { count: pendList }] = await Promise.all([
    c.canPost ? sb.from('households').select('id', { count: 'exact', head: true }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
    c.canMoney || c.isTreasurer ? sb.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
    c.canPost ? sb.from('listings').select('id', { count: 'exact', head: true }).eq('approved', false) : Promise.resolve({ count: 0 }),
  ]);
  const items: AdminItem[] = [{ href: '/admin', label: t('Overview', 'अवलोकन'), icon: 'home' }];
  if (c.canPost) items.push(
    { href: '/admin/approvals', label: t('Approvals', 'स्वीकृतियाँ'), icon: 'check', badge: pendFam ?? 0 },
    { href: '/admin/families', label: t('Families', 'परिवार'), icon: 'users' },
    { href: '/admin/announcements', label: t('Announcements', 'घोषणाएँ'), icon: 'bell' },
    { href: '/admin/gallery', label: t('Gallery', 'गैलरी'), icon: 'img' },
    { href: '/admin/community', label: t('Listings & aid', 'सूचियाँ व सहायता'), icon: 'heart', badge: pendList ?? 0 },
  );
  if (c.isAdmin || c.isTreasurer) items.push({ href: '/admin/finance', label: t('Finance', 'वित्त'), icon: 'rupee', badge: pendPay ?? 0 });
  if (c.isAdmin) items.push(
    { href: '/admin/chapters', label: t('Places (chapters)', 'स्थान (शाखाएँ)'), icon: 'map' },
    { href: '/admin/people', label: t('People & roles', 'लोग व भूमिकाएँ'), icon: 'family' },
    { href: '/admin/settings', label: t('Settings', 'सेटिंग'), icon: 'gear' },
    { href: '/admin/activity', label: t('Activity log', 'गतिविधि'), icon: 'list' },
  );
  const roleName: Record<string, string> = { admin: t('Admin', 'प्रबंधक'), coordinator: t('Coordinator', 'संयोजक'), treasurer: t('Treasurer', 'कोषाध्यक्ष') };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center gap-3 py-3 md:py-4">
        <Link href="/admin" className="mr-auto flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-brand-ink"><Icon name="shield" /></span>
          <span><b className="block font-display text-lg font-normal leading-tight">{t('Admin console', 'प्रबंधन')}</b>
            <span className="text-[0.8rem] text-muted">{roleName[c.role]}{c.profile?.chapter_id && c.household?.chapter ? ` · ${c.household.chapter.name}` : ''}</span></span>
        </Link>
        <Link href="/" className="btn-alt btn btn-sm">{t('Member portal', 'सदस्य पोर्टल')}</Link>
        <LangToggle next="/admin" />
        <form action={signOut}><button className="btn-alt btn btn-sm"><Icon name="out" className="h-4 w-4" />{t('Sign out', 'साइन आउट')}</button></form>
      </header>
      <div className="grid items-start gap-4 md:grid-cols-[230px_minmax(0,1fr)] md:gap-8">
        <AdminNav items={items} />
        <main className="rise flex min-w-0 flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}

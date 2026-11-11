import Link from 'next/link';
import { requireStaff } from '@/lib/ctx';
import { AdminNav, type AdminItem } from '@/components/admin-nav';
import { SubTabs, type TabGroup } from '@/components/sub-tabs';
import { LangToggle } from '@/components/lang-toggle';
import { Icon } from '@/components/icon';
import { signOutAdmin } from '../../actions';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const c = await requireStaff();
  const { t, sb } = c;
  const [{ count: pendFam }, { count: pendPay }, { count: pendList }] = await Promise.all([
    c.canPost ? sb.from('households').select('id', { count: 'exact', head: true }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
    c.canMoney || c.isTreasurer ? sb.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
    c.canPost ? sb.from('listings').select('id', { count: 'exact', head: true }).eq('approved', false) : Promise.resolve({ count: 0 }),
  ]);

  // Six places at most. Related pages are tabs inside a place.
  const items: AdminItem[] = [{ href: '/admin', label: t('Overview', 'अवलोकन'), icon: 'home' }];
  if (c.canPost) items.push(
    { href: '/admin/approvals', label: t('Families', 'परिवार'), icon: 'users', badge: pendFam ?? 0, match: ['/admin/families'] },
    { href: '/admin/announcements', label: t('Announce', 'घोषणा'), icon: 'bell', match: ['/admin/gallery'] },
    { href: '/admin/community', label: t('Help requests', 'सहयोग अनुरोध'), icon: 'heart', badge: pendList ?? 0 },
  );
  if (c.isAdmin || c.isTreasurer) items.push({ href: '/admin/finance', label: t('Money', 'धन'), icon: 'rupee', badge: pendPay ?? 0 });
  if (c.isAdmin) items.push({ href: '/admin/settings', label: t('Settings', 'सेटिंग'), icon: 'gear', match: ['/admin/chapters', '/admin/people', '/admin/activity'] });

  const groups: TabGroup[] = [
    { match: ['/admin/approvals', '/admin/families'], tabs: [{ href: '/admin/approvals', label: t('New requests', 'नए अनुरोध'), badge: pendFam ?? 0 }, { href: '/admin/families', label: t('All families', 'सभी परिवार') }] },
    { match: ['/admin/announcements', '/admin/gallery'], tabs: [{ href: '/admin/announcements', label: t('Events & notices', 'कार्यक्रम व सूचना') }, { href: '/admin/gallery', label: t('Photo albums', 'फोटो एल्बम') }] },
    { match: ['/admin/settings', '/admin/chapters', '/admin/people', '/admin/activity'], tabs: [
      { href: '/admin/settings', label: t('Fee & UPI', 'शुल्क व UPI') }, { href: '/admin/chapters', label: t('Places', 'स्थान') },
      { href: '/admin/people', label: t('People & roles', 'लोग व भूमिकाएँ') }, { href: '/admin/activity', label: t('History', 'इतिहास') }] },
  ];
  const roleName: Record<string, string> = { admin: t('Admin', 'प्रबंधक'), coordinator: t('Coordinator', 'संयोजक'), treasurer: t('Treasurer', 'कोषाध्यक्ष') };

  return (
    <div className="min-h-screen pb-16">
      {/* a dark band so nobody confuses the committee area with the member site */}
      <header className="bg-ink text-bg">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/admin" className="mr-auto flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Icon name="shield" /></span>
            <span><b className="block font-display text-lg font-normal leading-tight">{t('Committee area', 'समिति क्षेत्र')}</b>
              <span className="text-[0.8rem] opacity-70">{roleName[c.role]} · {c.profile?.full_name}</span></span>
          </Link>
          <Link href="/" className="rounded-xl border border-white/30 px-3 py-2 text-sm font-semibold">{t('Member site', 'सदस्य साइट')}</Link>
          <LangToggle next="/admin" />
          <form action={signOutAdmin}><button className="flex items-center gap-1.5 rounded-xl border border-white/30 px-3 py-2 text-sm font-semibold"><Icon name="out" className="h-4 w-4" />{t('Sign out', 'साइन आउट')}</button></form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 pt-5">
        <div className="grid items-start gap-4 md:grid-cols-[210px_minmax(0,1fr)] md:gap-8">
          <AdminNav items={items} />
          <main className="rise flex min-w-0 flex-col gap-5"><SubTabs groups={groups} />{children}</main>
        </div>
      </div>
    </div>
  );
}

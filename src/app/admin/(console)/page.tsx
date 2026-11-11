import Link from 'next/link';
import { requireStaff } from '@/lib/ctx';
import { Icon } from '@/components/icon';
import { PageHead } from '@/components/ui';
import { currentFy, inr } from '@/lib/utils';
import { getSettings } from '@/lib/settings';
import { getSetupState } from '@/lib/setup';
import { CopyButton } from '@/components/copy-button';
import fs from 'node:fs';
import path from 'node:path';

export default async function Overview({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff();
  const { t, sb } = c;
  const fy = currentFy();
  const count = async (table: string, f?: (q: any) => any) => {
    const q = sb.from(table).select('id', { count: 'exact', head: true });
    return ((f ? await f(q) : await q).count as number) ?? 0;
  };
  const [pendFam, pendPay, fam, ppl, chapters, coordinators, events, fee, cfg, { data: summary }] = await Promise.all([
    count('households', (q) => q.eq('status', 'pending')),
    count('payments', (q) => q.eq('status', 'pending')),
    count('households', (q) => q.eq('status', 'approved')),
    count('people', (q) => q.eq('deceased', false)),
    count('chapters'),
    count('profiles', (q) => q.in('role', ['coordinator', 'treasurer'])),
    count('events'),
    sb.from('fee_years').select('per_member').eq('fy', fy).maybeSingle().then((r) => r.data),
    getSettings(sb),
    sb.rpc('finance_summary', { p_fy: fy }),
  ]);
  const dbState = c.isAdmin ? await getSetupState(sb) : 'ready';
  let fixSql = '';
  if (dbState === 'needs_update') { try { fixSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'fix-everything.sql'), 'utf8'); } catch {} }
  const sum = (Array.isArray(summary) ? summary[0] : summary) ?? { income_dues: 0, income_occasion: 0, income_donation: 0, expenses: 0 };
  const income = Number(sum.income_dues) + Number(sum.income_occasion) + Number(sum.income_donation);

  const steps = [
    { done: chapters > 0, title: t('Add your places (optional)', 'अपने स्थान जोड़ें (वैकल्पिक)'), sub: t('Families can register without this. You can also create a place while approving a family.', 'इसके बिना भी परिवार पंजीकरण कर सकते हैं। परिवार को स्वीकृत करते समय भी आप स्थान बना सकते हैं।'), href: '/admin/chapters', cta: t('Add places', 'स्थान जोड़ें') },
    { done: !!fee, title: t('Set the yearly fee and UPI ID', 'वार्षिक शुल्क और UPI ID तय करें'), sub: t('For example ₹1,000 per member. Families pay to this UPI ID.', 'जैसे प्रति सदस्य ₹1,000। परिवार इसी UPI ID पर भुगतान करेंगे।'), href: '/admin/settings', cta: t('Open settings', 'सेटिंग खोलें') },
    { done: coordinators > 0, title: t('Choose a coordinator and a treasurer', 'संयोजक और कोषाध्यक्ष चुनें'), sub: t('They approve families and confirm payments for their place. They sign up like anyone, then you give them the role.', 'वे अपने स्थान के परिवारों को स्वीकृत करते हैं और भुगतान की पुष्टि करते हैं। वे सामान्य रूप से साइन अप करते हैं, फिर आप उन्हें भूमिका देते हैं।'), href: '/admin/people', cta: t('Give a role', 'भूमिका दें') },
    { done: events > 0, title: t('Announce your first event', 'पहला कार्यक्रम घोषित करें'), sub: t('Members see it on their home page.', 'सदस्य इसे अपने मुख्य पृष्ठ पर देखते हैं।'), href: '/admin/announcements', cta: t('Announce', 'घोषणा करें') },
  ];
  const left = steps.filter((s) => !s.done).length;

  return (
    <>
      <PageHead kicker={`${t('Hello', 'नमस्ते')}, ${(c.profile?.full_name || '').split(' ')[0]}`} title={t('Overview', 'अवलोकन')} />
      {sp.welcome && <div className="rounded-2xl bg-good-soft p-4 font-semibold text-good">{t('You are the admin. Follow the checklist below to open the portal to families.', 'आप प्रबंधक हैं। परिवारों के लिए पोर्टल खोलने हेतु नीचे की सूची देखें।')}</div>}

      {dbState === 'needs_update' && (
        <section className="card flex flex-col gap-3 border-bad">
          <h2 className="text-bad">{t('The database needs one quick update', 'डेटाबेस को एक छोटे अपडेट की ज़रूरत है')}</h2>
          <p>{t('Some things may show errors until you do this. It takes one minute and is safe.', 'जब तक यह नहीं करते, कुछ जगह त्रुटि दिख सकती है। इसमें एक मिनट लगता है और यह सुरक्षित है।')}</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>{t('Copy the update:', 'अपडेट कॉपी करें:')} <CopyButton text={fixSql} label={t('Copy update', 'अपडेट कॉपी करें')} doneLabel={t('Copied', 'कॉपी हुआ')} /></li>
            <li>{t('Supabase → SQL Editor → New query → paste → Run.', 'Supabase → SQL Editor → New query → पेस्ट करें → Run।')}</li>
            <li>{t('Come back here and refresh.', 'यहाँ लौटकर पेज रीफ़्रेश करें।')}</li>
          </ol>
        </section>
      )}
      {c.isAdmin && left > 0 && (
        <section className="card flex flex-col gap-4 border-accent">
          <div className="flex items-center justify-between gap-2"><h2>{t('Set up the portal', 'पोर्टल सेट करें')}</h2><span className="pill-warn">{left} {t('left', 'शेष')}</span></div>
          <ol className="flex flex-col gap-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className={`grid h-9 w-9 flex-none place-items-center rounded-full font-bold ${s.done ? 'bg-good text-white' : 'bg-line text-muted'}`}>{s.done ? <Icon name="check" className="h-5 w-5" /> : i + 1}</span>
                <div className="min-w-0 flex-1"><b className={s.done ? 'text-muted line-through' : ''}>{s.title}</b>{!s.done && <p className="text-sm text-muted">{s.sub}</p>}</div>
                {!s.done && <Link href={s.href} className="btn btn-sm self-center">{s.cta}</Link>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/approvals" className="card-link"><span className="lbl">{t('Waiting for approval', 'स्वीकृति की प्रतीक्षा')}</span><b className="block font-display text-3xl font-normal tabular-nums">{pendFam}</b></Link>
        <Link href="/admin/finance" className="card-link"><span className="lbl">{t('Payments to confirm', 'पुष्टि हेतु भुगतान')}</span><b className="block font-display text-3xl font-normal tabular-nums">{pendPay}</b></Link>
        <div className="card"><span className="lbl">{t('Families', 'परिवार')}</span><b className="block font-display text-3xl font-normal tabular-nums">{fam}</b></div>
        <div className="card"><span className="lbl">{t('People', 'सदस्य')}</span><b className="block font-display text-3xl font-normal tabular-nums">{ppl}</b></div>
      </div>

      {(c.isAdmin || c.isTreasurer) && (
        <section className="card flex flex-col gap-2">
          <h2>{t('This year', 'इस वर्ष')} ({fy})</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><span className="lbl">{t('Income', 'आय')}</span><b className="block font-display text-2xl font-normal tabular-nums text-good">{inr(income)}</b></div>
            <div><span className="lbl">{t('Spent', 'खर्च')}</span><b className="block font-display text-2xl font-normal tabular-nums text-bad">{inr(sum.expenses)}</b></div>
            <div><span className="lbl">{t('Balance', 'शेष')}</span><b className="block font-display text-2xl font-normal tabular-nums">{inr(income - Number(sum.expenses))}</b></div>
          </div>
          {!cfg.upi_id && c.isAdmin && <p className="text-sm text-warn">{t('The UPI ID is not set, so families cannot see how to pay.', 'UPI ID सेट नहीं है, इसलिए परिवार भुगतान का तरीका नहीं देख पाएँगे।')}</p>}
        </section>
      )}
    </>
  );
}

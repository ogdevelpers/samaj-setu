import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { DateBadge, PageHead } from '@/components/ui';
import { householdDues } from '@/lib/dues';
import { fmtDate, inr } from '@/lib/utils';

export default async function Home() {
  const c = await getCtx();
  const { t, lang, sb } = c;
  const name = (c.profile?.full_name || '').split(' ')[0];

  if (!c.isMember) {
    const status = c.household?.status;
    return (
      <>
        <PageHead kicker={`${t('Namaste', 'नमस्ते')}, ${name}`} title={t('Welcome to the samaj portal', 'समाज पोर्टल में आपका स्वागत है')} />
        <div className="card flex flex-col gap-3">
          {!c.household && (<><p>{t('Register your family to see the directory, events and gallery.', 'निर्देशिका, कार्यक्रम और गैलरी देखने के लिए अपने परिवार का पंजीकरण करें।')}</p><div><Link href="/register" className="btn-gold btn">{t('Register family', 'परिवार पंजीकरण')}</Link></div></>)}
          {status === 'pending' && (<><p><b>{t('Your registration is waiting for approval.', 'आपका पंजीकरण स्वीकृति की प्रतीक्षा में है।')}</b></p><p className="text-muted">{t('Your local coordinator will check it soon. You can add more family members meanwhile.', 'आपके स्थानीय संयोजक शीघ्र जाँच करेंगे। तब तक आप परिवार के और सदस्य जोड़ सकते हैं।')}</p><div><Link href="/family" className="btn">{t('My family', 'मेरा परिवार')}</Link></div></>)}
          {status === 'rejected' && (<><p><b>{t('Your registration was returned.', 'आपका पंजीकरण लौटा दिया गया।')}</b> {c.household?.reject_note}</p><div><Link href="/family" className="btn">{t('Fix and resend', 'सुधारें')}</Link></div></>)}
        </div>
      </>
    );
  }

  const nowIso = new Date().toISOString();
  const [{ data: stats }, { data: events }, { data: notices }, { data: bdays }] = await Promise.all([
    sb.rpc('community_stats'),
    sb.from('events').select('id,title,starts_at,venue,category').gte('starts_at', nowIso).order('starts_at').limit(3),
    sb.from('notices').select('id,title,body,category,created_at').order('created_at', { ascending: false }).limit(3),
    sb.rpc('upcoming_birthdays', { days: 7 }),
  ]);
  const s = Array.isArray(stats) ? stats[0] : stats;
  const dues = c.household ? await householdDues(sb, c.household.id, c.household.waiver_amount) : null;
  const soon = (bdays ?? []).filter((b: any) => {
    const diff = (new Date(b.on_day).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  });

  return (
    <>
      <PageHead kicker={`${t('Namaste', 'नमस्ते')}, ${name}`} title={t('Your family at a glance', 'आपके परिवार की झलक')} />
      {dues && dues.feeSet && (
        <section className="grid items-center gap-4 rounded-2xl bg-brand p-5 text-brand-ink sm:grid-cols-[1fr_auto]">
          <div>
            <span className="text-[0.74rem] font-semibold uppercase tracking-wider opacity-75">{c.household?.head_name} · {dues.members} {t('members', 'सदस्य')} · {t('FY', 'वित्त वर्ष')} {dues.fy}</span>
            {dues.balance > 0 ? (
              <h2 className="mt-1 !font-display !text-2xl !font-normal">{inr(dues.balance)} {t('due by 31 March', 'देय, 31 मार्च तक')}{dues.pending > 0 && <span className="ml-2 text-base opacity-80">({inr(dues.pending)} {t('awaiting confirmation', 'पुष्टि की प्रतीक्षा')})</span>}</h2>
            ) : (
              <h2 className="mt-1 !font-display !text-2xl !font-normal">{t('Dues paid for this year. Thank you.', 'इस वर्ष का शुल्क जमा है। धन्यवाद।')}</h2>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/payments" className="btn-gold btn">{t('Pay by UPI', 'UPI से भुगतान')}</Link>
            <Link href="/payments#occasion" className="btn border border-white/50 bg-transparent">{t('Contribute for an occasion', 'अवसर पर सहयोग दें')}</Link>
          </div>
        </section>
      )}
      <div className="grid-auto">
        <div className="card"><span className="lbl">{t('Households', 'परिवार')}</span><b className="block font-display text-3xl font-normal tabular-nums">{Number(s?.households ?? 0).toLocaleString('en-IN')}</b></div>
        <div className="card"><span className="lbl">{t('Members', 'सदस्य')}</span><b className="block font-display text-3xl font-normal tabular-nums">{Number(s?.members ?? 0).toLocaleString('en-IN')}</b></div>
        <div className="card"><span className="lbl">{t('Chapters', 'शाखाएँ')}</span><b className="block font-display text-3xl font-normal tabular-nums">{Number(s?.chapters ?? 0)}</b></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between"><h2>{t('Coming up', 'आगामी कार्यक्रम')}</h2><Link href="/events" className="btn-alt btn btn-sm">{t('All events', 'सभी कार्यक्रम')}</Link></div>
          {(events ?? []).length === 0 && <p className="text-muted">{t('No events announced yet.', 'अभी कोई कार्यक्रम घोषित नहीं हुआ।')}</p>}
          {(events ?? []).map((e) => (
            <div key={e.id} className="flex gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
              <DateBadge date={e.starts_at} lang={lang} />
              <div className="min-w-0"><b>{e.title}</b><p className="text-sm text-muted">{e.venue}</p></div>
            </div>
          ))}
        </section>
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between"><h2>{t('Notice board', 'सूचना पट')}</h2><Link href="/events#notices" className="btn-alt btn btn-sm">{t('All notices', 'सभी सूचनाएँ')}</Link></div>
          {(notices ?? []).length === 0 && <p className="text-muted">{t('No notices yet.', 'अभी कोई सूचना नहीं।')}</p>}
          {(notices ?? []).map((n) => (
            <div key={n.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <b>{n.title}</b>
              <p className="line-clamp-2 text-sm">{n.body}</p>
              <p className="text-sm text-muted">{fmtDate(n.created_at, lang)}</p>
            </div>
          ))}
        </section>
      </div>
      {soon.length > 0 && (
        <section className="card flex flex-col gap-2">
          <h2>{t('Birthdays this week', 'इस सप्ताह जन्मदिन')}</h2>
          {soon.map((b: any, i: number) => (
            <p key={i}><b>{b.full_name}</b> <span className="text-muted">· {fmtDate(b.on_day, lang, { day: 'numeric', month: 'short' })} · {b.area}</span></p>
          ))}
        </section>
      )}
    </>
  );
}

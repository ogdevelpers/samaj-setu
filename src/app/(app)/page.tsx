import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { DateBadge } from '@/components/ui';
import { Icon } from '@/components/icon';
import { householdDues } from '@/lib/dues';
import { fmtDate, inr } from '@/lib/utils';

export default async function Home() {
  const c = await getCtx();
  const { t, lang, sb } = c;
  const name = (c.profile?.full_name || '').split(' ')[0];
  const hello = (
    <div className="flex flex-col gap-1">
      <span className="lbl">{t('Namaste', 'नमस्ते')}</span>
      <h1>{name || t('Welcome', 'स्वागत है')}</h1>
    </div>
  );

  if (!c.isMember) {
    const status = c.household?.status as string | undefined;
    const steps = [
      { done: !!c.household, title: t('Register your family', 'अपने परिवार का पंजीकरण करें'), sub: t('Name, place and contact. Takes two minutes.', 'नाम, स्थान और संपर्क। दो मिनट लगते हैं।'), href: '/register' },
      { done: !!c.household, title: t('Add your family members', 'परिवार के सदस्य जोड़ें'), sub: t('Spouse, children and parents. This builds your family tree.', 'जीवनसाथी, बच्चे और माता-पिता। इससे वंश वृक्ष बनता है।'), href: '/family' },
      { done: false, title: t('Wait for your coordinator to approve', 'संयोजक की स्वीकृति की प्रतीक्षा'), sub: t('Usually within a day or two. Then everything opens up.', 'आमतौर पर एक-दो दिन में। फिर सब कुछ खुल जाता है।'), href: '' },
    ];
    return (
      <>
        {hello}
        <section className="card flex flex-col gap-4">
          <h2>{t('Getting started', 'शुरुआत करें')}</h2>
          {status === 'rejected' && <div className="rounded-xl bg-bad-soft p-3 text-bad"><b>{t('Your registration was returned.', 'आपका पंजीकरण लौटाया गया।')}</b> {c.household?.reject_note}</div>}
          <ol className="flex flex-col gap-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className={`grid h-9 w-9 flex-none place-items-center rounded-full font-bold ${s.done ? 'bg-good text-white' : i === (c.household ? 2 : 0) ? 'bg-accent text-accent-ink' : 'bg-line text-muted'}`}>{s.done ? <Icon name="check" className="h-5 w-5" /> : i + 1}</span>
                <div className="min-w-0 flex-1"><b>{s.title}</b><p className="text-sm text-muted">{s.sub}</p></div>
                {s.href && !s.done && <Link href={s.href} className="btn btn-sm self-center">{t('Start', 'शुरू करें')}</Link>}
                {s.href && s.done && i === 1 && <Link href={s.href} className="btn-alt btn btn-sm self-center">{t('Open', 'खोलें')}</Link>}
              </li>
            ))}
          </ol>
          {status === 'pending' && <p className="rounded-xl bg-warn-soft p-3 text-warn">{t('Your registration is with the coordinator of your place.', 'आपका पंजीकरण आपके स्थान के संयोजक के पास है।')}</p>}
        </section>
      </>
    );
  }

  const nowIso = new Date().toISOString();
  const [{ data: stats }, { data: events }, { data: notices }, { data: bdays }] = await Promise.all([
    sb.rpc('community_stats'),
    sb.from('events').select('id,title,starts_at,venue').gte('starts_at', nowIso).order('starts_at').limit(3),
    sb.from('notices').select('id,title,body,category,created_at').order('created_at', { ascending: false }).limit(3),
    sb.rpc('upcoming_birthdays', { days: 7 }),
  ]);
  const s = Array.isArray(stats) ? stats[0] : stats;
  const dues = c.household ? await householdDues(sb, c.household.id, c.household.waiver_amount) : null;
  const today = new Date(new Date().toDateString()).getTime();
  const soon = (bdays ?? []).filter((b: any) => { const d = (new Date(b.on_day).getTime() - today) / 86400000; return d >= 0 && d <= 7; });
  const tiles: [string, string, string][] = [
    ['/payments', 'rupee', t('Pay dues', 'शुल्क भरें')], ['/events', 'cal', t('Events', 'कार्यक्रम')], ['/gallery', 'img', t('Gallery', 'गैलरी')],
    ['/family', 'family', t('My family', 'मेरा परिवार')], ['/tree', 'tree', t('Family tree', 'वंश वृक्ष')], ['/community', 'heart', t('Help', 'सहयोग')],
  ];

  return (
    <>
      {hello}
      {dues && dues.feeSet && (
        <section className="grid items-center gap-4 rounded-3xl bg-brand p-5 text-brand-ink sm:grid-cols-[1fr_auto] sm:p-6">
          <div>
            <span className="text-[0.74rem] font-semibold uppercase tracking-wider opacity-75">{dues.members} {t('members', 'सदस्य')} · {t('FY', 'वित्त वर्ष')} {dues.fy}</span>
            {dues.balance > 0 ? (
              <>
                <h2 className="mt-1 !font-display !text-[1.7rem] !font-normal leading-tight">{inr(dues.balance)} {t('to pay', 'भरना है')}</h2>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25"><i className="block h-full rounded-full bg-accent" style={{ width: `${dues.total ? Math.min(100, (dues.paid / dues.total) * 100) : 0}%` }} /></div>
                <p className="mt-1 text-sm opacity-80">{inr(dues.paid)} {t('paid of', 'जमा, कुल')} {inr(dues.total)}{dues.pending > 0 ? ` · ${inr(dues.pending)} ${t('awaiting confirmation', 'पुष्टि की प्रतीक्षा में')}` : ''}</p>
              </>
            ) : (
              <h2 className="mt-1 !font-display !text-[1.7rem] !font-normal leading-tight">{t('Dues paid for this year. Thank you.', 'इस वर्ष का शुल्क जमा है। धन्यवाद।')}</h2>
            )}
          </div>
          <Link href="/payments" className="btn-gold btn">{dues.balance > 0 ? t('Pay by UPI', 'UPI से भुगतान') : t('Receipts', 'रसीदें')}</Link>
        </section>
      )}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {tiles.map(([href, icon, label]) => (
          <Link key={href} href={href} className="card-link flex flex-col items-center gap-2 !p-3 text-center text-sm font-semibold">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon name={icon} className="h-6 w-6" /></span>{label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between"><h2>{t('Coming up', 'आगामी कार्यक्रम')}</h2><Link href="/events" className="text-sm font-semibold text-brand underline">{t('All', 'सभी')}</Link></div>
          {(events ?? []).length === 0 && <p className="text-muted">{t('No events announced yet.', 'अभी कोई कार्यक्रम घोषित नहीं हुआ।')}</p>}
          {(events ?? []).map((e) => (
            <Link href="/events" key={e.id} className="flex gap-3 rounded-xl border border-line p-2.5 hover:border-brand">
              <DateBadge date={e.starts_at} lang={lang} />
              <div className="min-w-0"><b className="block truncate">{e.title}</b><p className="truncate text-sm text-muted">{e.venue}</p></div>
            </Link>
          ))}
        </section>
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between"><h2>{t('Notice board', 'सूचना पट')}</h2><Link href="/events#notices" className="text-sm font-semibold text-brand underline">{t('All', 'सभी')}</Link></div>
          {(notices ?? []).length === 0 && <p className="text-muted">{t('No notices yet.', 'अभी कोई सूचना नहीं।')}</p>}
          {(notices ?? []).map((n) => (
            <div key={n.id} className="rounded-xl border border-line p-3">
              <b>{n.title}</b>
              {n.body && <p className="line-clamp-2 text-sm">{n.body}</p>}
              <p className="text-sm text-muted">{fmtDate(n.created_at, lang)}</p>
            </div>
          ))}
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><span className="lbl">{t('Families', 'परिवार')}</span><b className="block font-display text-3xl font-normal tabular-nums">{Number(s?.households ?? 0).toLocaleString('en-IN')}</b></div>
        <div className="card"><span className="lbl">{t('Members', 'सदस्य')}</span><b className="block font-display text-3xl font-normal tabular-nums">{Number(s?.members ?? 0).toLocaleString('en-IN')}</b></div>
        <div className="card"><span className="lbl">{t('Places', 'स्थान')}</span><b className="block font-display text-3xl font-normal tabular-nums">{Number(s?.chapters ?? 0)}</b></div>
      </div>

      {soon.length > 0 && (
        <section className="card flex flex-col gap-2">
          <h2>🎂 {t('Birthdays this week', 'इस सप्ताह जन्मदिन')}</h2>
          {soon.map((b: any, i: number) => <p key={i}><b>{b.full_name}</b> <span className="text-muted">· {fmtDate(b.on_day, lang, { day: 'numeric', month: 'short' })} · {b.area}</span></p>)}
        </section>
      )}
    </>
  );
}

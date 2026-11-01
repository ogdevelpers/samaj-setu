import { requireMember } from '@/lib/ctx';
import { toggleRsvp } from './actions';
import { DateBadge, Empty, Flash, PageHead, WhatsAppShare } from '@/components/ui';
import { RsvpButton } from '@/components/rsvp-button';
import { Icon } from '@/components/icon';
import { fmtDate, fmtDateTime } from '@/lib/utils';
import Link from 'next/link';

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireMember();
  const { t, lang, sb } = c;
  const now = new Date().toISOString();
  const [{ data: upcoming }, { data: past }, { data: notices }, { data: rsvps }, { data: mine }] = await Promise.all([
    sb.from('events').select('*, chapter:chapters(name)').gte('starts_at', now).order('starts_at'),
    sb.from('events').select('id,title,starts_at,venue').lt('starts_at', now).order('starts_at', { ascending: false }).limit(5),
    sb.from('notices').select('*, chapter:chapters(name)').order('created_at', { ascending: false }).limit(30),
    sb.from('rsvps').select('event_id'),
    sb.from('rsvps').select('event_id').eq('user_id', c.user.id),
  ]);
  const going = new Map<string, number>();
  (rsvps ?? []).forEach((r) => going.set(r.event_id, (going.get(r.event_id) ?? 0) + 1));
  const mineSet = new Set((mine ?? []).map((r) => r.event_id));
  const cat: Record<string, string> = {
    general: t('General', 'सामान्य'), finance: t('Finance', 'वित्त'), education: t('Education', 'शिक्षा'), condolence: t('Condolence', 'शोक'), shubh: t('Shubh', 'शुभ'),
    function: t('Function', 'आयोजन'), religious: t('Religious', 'धार्मिक'), meeting: t('Meeting', 'बैठक'), service: t('Service', 'सेवा'),
  };

  return (
    <>
      <PageHead kicker={t('Announcements', 'घोषणाएँ')} title={t('Events & notices', 'कार्यक्रम व सूचना')}>
        {c.canPost && <Link href="/admin/announcements" className="btn-gold btn btn-sm"><Icon name="plus" className="h-4 w-4" />{t('Announce', 'घोषणा करें')}</Link>}
      </PageHead>
      <Flash ok={sp.ok} err={sp.err} />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2>{t('Upcoming functions', 'आगामी आयोजन')}</h2>
          {(upcoming ?? []).length === 0 && <Empty>{t('No upcoming events. Check back soon.', 'कोई आगामी कार्यक्रम नहीं। जल्द देखें।')}</Empty>}
          {(upcoming ?? []).map((e) => (
            <article key={e.id} className="card flex gap-3">
              <DateBadge date={e.starts_at} lang={lang} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><b className="text-[1.05rem]">{e.title}</b><span className="pill">{cat[e.category] ?? e.category}</span></div>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted"><Icon name="cal" className="h-4 w-4" />{fmtDateTime(e.starts_at, lang)}</p>
                {e.venue && <p className="flex items-center gap-1.5 text-sm text-muted"><Icon name="map" className="h-4 w-4" />{e.venue}</p>}
                {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                <p className="mt-1 text-sm text-muted">{e.chapter?.name ?? t('All chapters', 'सभी शाखाएँ')} · <b className="tabular-nums">{going.get(e.id) ?? 0}</b> {t('attending', 'आ रहे हैं')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RsvpButton eventId={e.id} going={mineSet.has(e.id)} action={toggleRsvp} labels={{ on: t('Going ✓', 'आ रहे हैं ✓'), off: t('I will come', 'मैं आऊँगा/आऊँगी') }} />
                  <WhatsAppShare label={t('Share', 'साझा करें')} text={`${e.title}\n${fmtDateTime(e.starts_at, lang)}${e.venue ? '\n' + e.venue : ''}`} />
                </div>
              </div>
            </article>
          ))}
          {(past ?? []).length > 0 && (
            <details className="card-flat text-sm"><summary className="cursor-pointer font-semibold text-muted">{t('Recent past events', 'हाल के पुराने कार्यक्रम')}</summary>
              {(past ?? []).map((e) => <p key={e.id} className="mt-1">{fmtDate(e.starts_at, lang)} · {e.title}</p>)}
            </details>
          )}
        </section>

        <section id="notices" className="flex flex-col gap-3">
          <h2>{t('Notice board', 'सूचना पट')}</h2>
          {(notices ?? []).length === 0 && <Empty>{t('No notices yet.', 'अभी कोई सूचना नहीं।')}</Empty>}
          {(notices ?? []).map((n) => (
            <article key={n.id} className="card flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2"><span className={n.category === 'condolence' ? 'pill-bad' : n.category === 'shubh' ? 'pill-good' : n.category === 'finance' ? 'pill-warn' : 'pill'}>{cat[n.category]}</span><span className="text-sm text-muted">{fmtDate(n.created_at, lang)} · {n.chapter?.name ?? t('All chapters', 'सभी शाखाएँ')}</span></div>
              <b>{n.title}</b>
              {n.body && <p className="whitespace-pre-line text-sm">{n.body}</p>}
              <div className="mt-1"><WhatsAppShare label={t('Share', 'साझा करें')} text={`${n.title}\n${n.body ?? ''}`} /></div>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}

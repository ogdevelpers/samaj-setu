import { requireMember } from '@/lib/ctx';
import { createEvent, createNotice, deleteItem, toggleRsvp } from './actions';
import { DateBadge, Empty, Flash, PageHead, Field, WhatsAppShare } from '@/components/ui';
import { Submit } from '@/components/submit';
import { fmtDate, fmtDateTime } from '@/lib/utils';

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireMember();
  const { t, lang, sb } = c;
  const now = new Date().toISOString();
  const [{ data: upcoming }, { data: past }, { data: notices }, { data: chapters }, { data: rsvps }, { data: mine }] = await Promise.all([
    sb.from('events').select('*, chapter:chapters(name)').gte('starts_at', now).order('starts_at'),
    sb.from('events').select('id,title,starts_at,venue').lt('starts_at', now).order('starts_at', { ascending: false }).limit(5),
    sb.from('notices').select('*, chapter:chapters(name)').order('created_at', { ascending: false }).limit(30),
    sb.from('chapters').select('id,name').order('name'),
    sb.from('rsvps').select('event_id'),
    sb.from('rsvps').select('event_id').eq('user_id', c.user.id),
  ]);
  const going = new Map<string, number>();
  (rsvps ?? []).forEach((r) => going.set(r.event_id, (going.get(r.event_id) ?? 0) + 1));
  const mineSet = new Set((mine ?? []).map((r) => r.event_id));
  const catLabel: Record<string, string> = {
    general: t('General', 'सामान्य'), finance: t('Finance', 'वित्त'), education: t('Education', 'शिक्षा'), condolence: t('Condolence', 'शोक'), shubh: t('Shubh', 'शुभ'),
    function: t('Function', 'आयोजन'), religious: t('Religious', 'धार्मिक'), meeting: t('Meeting', 'बैठक'), service: t('Service', 'सेवा'),
  };
  const chapterSelect = c.isAdmin && (
    <Field label={t('For', 'किसके लिए')}>
      <select name="chapter" className="input" defaultValue="all">
        <option value="all">{t('Everyone (all chapters)', 'सभी (सभी शाखाएँ)')}</option>
        {(chapters ?? []).map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
      </select>
    </Field>
  );

  return (
    <>
      <PageHead kicker={t('Announcements', 'घोषणाएँ')} title={t('Events & notices', 'कार्यक्रम व सूचना')} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-3">
          <h2>{t('Upcoming functions', 'आगामी आयोजन')}</h2>
          {(upcoming ?? []).length === 0 && <Empty>{t('No upcoming events.', 'कोई आगामी कार्यक्रम नहीं।')}</Empty>}
          {(upcoming ?? []).map((e) => (
            <div key={e.id} className="flex flex-wrap gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
              <DateBadge date={e.starts_at} lang={lang} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><b>{e.title}</b><span className="pill">{catLabel[e.category] ?? e.category}</span></div>
                <p className="text-sm text-muted">{fmtDateTime(e.starts_at, lang)}{e.venue ? ` · ${e.venue}` : ''}</p>
                {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                <p className="text-sm text-muted">{e.chapter?.name ?? t('All chapters', 'सभी शाखाएँ')} · <span className="tabular-nums">{going.get(e.id) ?? 0}</span> {t('attending', 'आ रहे हैं')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={toggleRsvp}><input type="hidden" name="id" value={e.id} /><Submit className={mineSet.has(e.id) ? 'btn-alt btn btn-sm' : 'btn btn-sm'}>{mineSet.has(e.id) ? t('Going ✓', 'आ रहे हैं ✓') : t('I will come', 'मैं आऊँगा/आऊँगी')}</Submit></form>
                  <WhatsAppShare label={t('Share on WhatsApp', 'WhatsApp पर भेजें')} text={`${e.title}\n${fmtDateTime(e.starts_at, lang)}${e.venue ? '\n' + e.venue : ''}`} />
                  {c.canPost && <form action={deleteItem}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="table" value="events" /><Submit className="btn-bad btn btn-sm">{t('Delete', 'हटाएँ')}</Submit></form>}
                </div>
              </div>
            </div>
          ))}
          {(past ?? []).length > 0 && (
            <details className="text-sm"><summary className="cursor-pointer text-muted">{t('Recent past events', 'हाल के पुराने कार्यक्रम')}</summary>
              {(past ?? []).map((e) => <p key={e.id} className="mt-1">{fmtDate(e.starts_at, lang)} · {e.title}</p>)}
            </details>
          )}
        </section>

        <section id="notices" className="card flex flex-col gap-3">
          <h2>{t('Notice board', 'सूचना पट')}</h2>
          {(notices ?? []).length === 0 && <Empty>{t('No notices yet.', 'अभी कोई सूचना नहीं।')}</Empty>}
          {(notices ?? []).map((n) => (
            <div key={n.id} className="flex gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
              <span className={n.category === 'condolence' ? 'pill-bad h-fit' : n.category === 'shubh' ? 'pill-good h-fit' : n.category === 'finance' ? 'pill-warn h-fit' : 'pill h-fit'}>{catLabel[n.category]}</span>
              <div className="min-w-0 flex-1">
                <b>{n.title}</b>
                {n.body && <p className="whitespace-pre-line text-sm">{n.body}</p>}
                <p className="text-sm text-muted">{n.chapter?.name ?? t('All chapters', 'सभी शाखाएँ')} · {fmtDate(n.created_at, lang)}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <WhatsAppShare label={t('Share on WhatsApp', 'WhatsApp पर भेजें')} text={`${n.title}\n${n.body ?? ''}`} />
                  {c.canPost && <form action={deleteItem}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="table" value="notices" /><Submit className="btn-bad btn btn-sm">{t('Delete', 'हटाएँ')}</Submit></form>}
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      {c.canPost && (
        <div className="grid gap-4 lg:grid-cols-2">
          <form action={createEvent} className="card flex flex-col gap-3">
            <h2>{t('Announce an event', 'कार्यक्रम घोषित करें')}</h2>
            <Field label={t('Title', 'शीर्षक')}><input name="title" required className="input" /></Field>
            <div className="form-grid">
              <Field label={t('Date and time', 'दिनांक और समय')}><input name="starts_at" type="datetime-local" required className="input" /></Field>
              <Field label={t('Type', 'प्रकार')}>
                <select name="category" className="input">{['function', 'religious', 'meeting', 'service'].map((k) => <option key={k} value={k}>{catLabel[k]}</option>)}</select>
              </Field>
            </div>
            <Field label={t('Venue', 'स्थान')}><input name="venue" className="input" /></Field>
            <Field label={t('Details', 'विवरण')}><textarea name="description" rows={2} className="input" /></Field>
            {chapterSelect}
            <div><Submit className="btn-gold">{t('Announce', 'घोषित करें')}</Submit></div>
          </form>
          <form action={createNotice} className="card flex flex-col gap-3">
            <h2>{t('Post a notice', 'सूचना प्रकाशित करें')}</h2>
            <Field label={t('Title', 'शीर्षक')}><input name="title" required className="input" /></Field>
            <Field label={t('Type', 'प्रकार')}>
              <select name="category" className="input">{['general', 'finance', 'education', 'shubh', 'condolence'].map((k) => <option key={k} value={k}>{catLabel[k]}</option>)}</select>
            </Field>
            <Field label={t('Message', 'संदेश')}><textarea name="body" rows={3} className="input" /></Field>
            {chapterSelect}
            <div><Submit className="btn-gold">{t('Post', 'प्रकाशित करें')}</Submit></div>
          </form>
        </div>
      )}
    </>
  );
}

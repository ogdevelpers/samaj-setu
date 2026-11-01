import { requireStaff } from '@/lib/ctx';
import { createEvent, createNotice, deleteItem } from '../actions';
import { Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { fmtDate, fmtDateTime } from '@/lib/utils';

export default async function Announcements({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff(['admin', 'coordinator']);
  const { t, lang, sb } = c;
  const [{ data: chapters }, { data: events }, { data: notices }] = await Promise.all([
    sb.from('chapters').select('id,name').order('name'),
    sb.from('events').select('id,title,starts_at').order('starts_at', { ascending: false }).limit(10),
    sb.from('notices').select('id,title,created_at,category').order('created_at', { ascending: false }).limit(10),
  ]);
  const cat: Record<string, string> = { general: t('General', 'सामान्य'), finance: t('Finance', 'वित्त'), education: t('Education', 'शिक्षा'), shubh: t('Shubh samachar', 'शुभ समाचार'), condolence: t('Condolence', 'शोक सूचना'), function: t('Function', 'आयोजन'), religious: t('Religious', 'धार्मिक'), meeting: t('Meeting', 'बैठक'), service: t('Service', 'सेवा') };
  const forWho = c.isAdmin && (
    <Field label={t('For', 'किसके लिए')}><select name="chapter" className="input" defaultValue="all"><option value="all">{t('Everyone', 'सभी')}</option>{(chapters ?? []).map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</select></Field>
  );
  return (
    <>
      <PageHead kicker={t('Reach every member', 'हर सदस्य तक पहुँचें')} title={t('Announcements', 'घोषणाएँ')} sub={t('Events and notices appear on members\' home page. Members can share them on WhatsApp.', 'कार्यक्रम और सूचनाएँ सदस्यों के मुख्य पृष्ठ पर दिखती हैं। सदस्य उन्हें WhatsApp पर साझा कर सकते हैं।')} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="grid gap-4 lg:grid-cols-2">
        <form action={createEvent} className="card flex flex-col gap-3">
          <h2>{t('Announce an event', 'कार्यक्रम घोषित करें')}</h2>
          <Field label={t('Title', 'शीर्षक')}><input name="title" required className="input" /></Field>
          <div className="form-grid">
            <Field label={t('Date and time', 'दिनांक और समय')}><input name="starts_at" type="datetime-local" required className="input" /></Field>
            <Field label={t('Type', 'प्रकार')}><select name="category" className="input">{['function', 'religious', 'meeting', 'service'].map((k) => <option key={k} value={k}>{cat[k]}</option>)}</select></Field>
          </div>
          <Field label={t('Venue', 'स्थान')}><input name="venue" className="input" /></Field>
          <Field label={t('Details', 'विवरण')}><textarea name="description" rows={2} className="input" /></Field>
          {forWho}
          <div><Submit className="btn-gold">{t('Announce', 'घोषित करें')}</Submit></div>
        </form>
        <form action={createNotice} className="card flex flex-col gap-3">
          <h2>{t('Post a notice', 'सूचना प्रकाशित करें')}</h2>
          <Field label={t('Title', 'शीर्षक')}><input name="title" required className="input" /></Field>
          <Field label={t('Type', 'प्रकार')}><select name="category" className="input">{['general', 'finance', 'education', 'shubh', 'condolence'].map((k) => <option key={k} value={k}>{cat[k]}</option>)}</select></Field>
          <Field label={t('Message', 'संदेश')}><textarea name="body" rows={3} className="input" /></Field>
          {forWho}
          <div><Submit className="btn-gold">{t('Post', 'प्रकाशित करें')}</Submit></div>
        </form>
      </div>
      <section className="card flex flex-col gap-2">
        <h2>{t('Recent', 'हाल के')}</h2>
        {[...(events ?? []).map((e) => ({ ...e, table: 'events', when: fmtDateTime(e.starts_at, lang), tag: cat.function })), ...(notices ?? []).map((n) => ({ ...n, table: 'notices', when: fmtDate(n.created_at, lang), tag: cat[n.category] }))].map((x) => (
          <div key={x.table + x.id} className="flex flex-wrap items-center gap-3 border-t border-line pt-2 first:border-0 first:pt-0">
            <div className="min-w-0 flex-1"><b>{x.title}</b><p className="text-sm text-muted">{x.tag} · {x.when}</p></div>
            <form action={deleteItem}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="table" value={x.table} /><Submit className="btn-bad btn btn-sm">{t('Delete', 'हटाएँ')}</Submit></form>
          </div>
        ))}
      </section>
    </>
  );
}

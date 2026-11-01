import Link from 'next/link';
import { requireStaff } from '@/lib/ctx';
import { createAlbum } from '@/app/(app)/gallery/actions';
import { Empty, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { fmtDate } from '@/lib/utils';

export default async function AdminGallery({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff(['admin', 'coordinator']);
  const { t, lang, sb } = c;
  const [{ data: chapters }, { data: events }, { data: albums }] = await Promise.all([
    sb.from('chapters').select('id,name').order('name'),
    sb.from('events').select('id,title,starts_at').order('starts_at', { ascending: false }).limit(30),
    sb.from('albums').select('id,title,event_date, photos(count)').order('event_date', { ascending: false }).limit(20),
  ]);
  return (
    <>
      <PageHead kicker={t('Event photos', 'कार्यक्रम के फोटो')} title={t('Gallery', 'गैलरी')} sub={t('Create an album for an event, then add its photos. Members find albums by year, month and date.', 'किसी कार्यक्रम का एल्बम बनाएँ, फिर उसके फोटो जोड़ें। सदस्य वर्ष, माह और तारीख से एल्बम खोजते हैं।')} />
      <Flash ok={sp.ok} err={sp.err} />
      <form action={createAlbum} className="card flex flex-col gap-3">
        <h2>{t('Create an album', 'नया एल्बम बनाएँ')}</h2>
        <div className="form-grid">
          <Field label={t('Album title', 'एल्बम का शीर्षक')}><input name="title" required className="input" /></Field>
          <Field label={t('Event date', 'कार्यक्रम की तारीख')}><input name="event_date" type="date" required className="input" /></Field>
          <Field label={t('Linked event (optional)', 'जुड़ा कार्यक्रम (वैकल्पिक)')}><select name="event_id" className="input" defaultValue=""><option value="">—</option>{(events ?? []).map((e) => <option key={e.id} value={e.id}>{fmtDate(e.starts_at, lang)} · {e.title}</option>)}</select></Field>
          {c.isAdmin && <Field label={t('Place', 'स्थान')}><select name="chapter" className="input" defaultValue="all"><option value="all">{t('All', 'सभी')}</option>{(chapters ?? []).map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</select></Field>}
          <Field label={t('YouTube link for video (optional)', 'वीडियो का YouTube लिंक (वैकल्पिक)')}><input name="video_url" type="url" className="input" /></Field>
        </div>
        <div><Submit className="btn-gold">{t('Create and add photos', 'बनाएँ और फोटो जोड़ें')}</Submit></div>
      </form>
      {(albums ?? []).length === 0 ? <Empty>{t('No albums yet.', 'अभी कोई एल्बम नहीं।')}</Empty> : (
        <section className="card flex flex-col gap-2">
          <h2>{t('Recent albums', 'हाल के एल्बम')}</h2>
          {(albums ?? []).map((a: any) => (
            <Link key={a.id} href={`/gallery/${a.id}`} className="flex items-center gap-3 border-t border-line pt-2 first:border-0 first:pt-0 hover:text-brand">
              <div className="min-w-0 flex-1"><b>{a.title}</b><p className="text-sm text-muted">{fmtDate(a.event_date, lang)}</p></div>
              <span className="pill">{a.photos?.[0]?.count ?? 0} {t('photos', 'फोटो')}</span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}

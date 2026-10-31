import Link from 'next/link';
import { requireMember } from '@/lib/ctx';
import { createAlbum } from './actions';
import { Empty, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { fmtDate, monthName } from '@/lib/utils';

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ y?: string; m?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireMember();
  const { t, lang, sb } = c;
  const { data: all } = await sb.from('albums').select('id,title,event_date,chapter:chapters(name), photos(count)').order('event_date', { ascending: false });
  const albums = all ?? [];
  const years = [...new Set(albums.map((a) => a.event_date.slice(0, 4)))];
  const y = sp.y && years.includes(sp.y) ? sp.y : '';
  const m = sp.m && /^\d+$/.test(sp.m) ? Number(sp.m) : -1;
  const shown = albums.filter((a) => (!y || a.event_date.startsWith(y)) && (m < 0 || Number(a.event_date.slice(5, 7)) - 1 === m));

  const covers = new Map<string, string>();
  if (shown.length) {
    const { data: ph } = await sb.from('photos').select('album_id,thumb_path').in('album_id', shown.map((a) => a.id)).order('created_at').limit(500);
    (ph ?? []).forEach((p) => { if (!covers.has(p.album_id)) covers.set(p.album_id, p.thumb_path); });
  }
  const urls = new Map<string, string>();
  if (covers.size) {
    const { data: signed } = await sb.storage.from('gallery').createSignedUrls([...covers.values()], 3600);
    (signed ?? []).forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  const groups = new Map<string, typeof shown>();
  shown.forEach((a) => groups.set(a.event_date.slice(0, 7), [...(groups.get(a.event_date.slice(0, 7)) ?? []), a]));
  const [{ data: chapters }, { data: events }] = c.canPost
    ? await Promise.all([sb.from('chapters').select('id,name').order('name'), sb.from('events').select('id,title,starts_at').order('starts_at', { ascending: false }).limit(30)])
    : [{ data: [] }, { data: [] }];

  const href = (yy: string, mm: number) => `/gallery?${new URLSearchParams({ ...(yy ? { y: yy } : {}), ...(mm >= 0 ? { m: String(mm) } : {}) })}`;

  return (
    <>
      <PageHead kicker={t('Memories', 'यादें')} title={t('Gallery', 'गैलरी')} sub={t('Albums belong to an event, so year, month and date come from the event itself.', 'एल्बम किसी कार्यक्रम का होता है, इसलिए वर्ष, माह और तारीख कार्यक्रम से ही मिलते हैं।')} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="card flex flex-wrap items-start gap-x-8 gap-y-3">
        <div><span className="lbl">{t('Year', 'वर्ष')}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Link className="chip" aria-pressed={!y} href={href('', m)}>{t('All', 'सभी')}</Link>
            {years.map((yy) => <Link key={yy} className="chip" aria-pressed={y === yy} href={href(yy, m)}>{yy}</Link>)}
          </div></div>
        <div><span className="lbl">{t('Month', 'माह')}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Link className="chip" aria-pressed={m < 0} href={href(y, -1)}>{t('All', 'सभी')}</Link>
            {Array.from({ length: 12 }, (_, i) => <Link key={i} className="chip" aria-pressed={m === i} href={href(y, i)}>{monthName(i, lang).slice(0, lang === 'hi' ? 6 : 3)}</Link>)}
          </div></div>
      </div>
      {groups.size === 0 && <Empty>{t('No albums for this year and month yet.', 'इस वर्ष और माह के लिए अभी कोई एल्बम नहीं।')}</Empty>}
      {[...groups.entries()].map(([key, list]) => (
        <section key={key} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3"><h2 className="!font-display !text-2xl !font-normal">{monthName(Number(key.slice(5)) - 1, lang)} {key.slice(0, 4)}</h2><span className="text-sm text-muted">{list.length} {t('albums', 'एल्बम')}</span></div>
          <div className="grid-auto">
            {list.map((a) => {
              const cover = covers.get(a.id);
              const url = cover ? urls.get(cover) : undefined;
              const count = (a.photos as unknown as { count: number }[])?.[0]?.count ?? 0;
              return (
                <Link key={a.id} href={`/gallery/${a.id}`} className="overflow-hidden rounded-xl border border-line bg-surface hover:border-brand">
                  <div className="grid aspect-[16/10] place-items-center bg-brand-soft font-display text-2xl text-brand">
                    {url ? <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" /> : fmtDate(a.event_date, lang, { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="p-3"><b>{a.title}</b><p className="text-sm text-muted">{fmtDate(a.event_date, lang)} · {(a.chapter as any)?.name ?? t('All chapters', 'सभी शाखाएँ')} · {count} {t('photos', 'फोटो')}</p></div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      {c.canPost && (
        <form action={createAlbum} className="card flex flex-col gap-3">
          <h2>{t('Create an album', 'नया एल्बम बनाएँ')}</h2>
          <div className="form-grid">
            <Field label={t('Album title', 'एल्बम का शीर्षक')}><input name="title" required className="input" /></Field>
            <Field label={t('Event date', 'कार्यक्रम की तारीख')}><input name="event_date" type="date" required className="input" /></Field>
            <Field label={t('Linked event (optional)', 'जुड़ा कार्यक्रम (वैकल्पिक)')}>
              <select name="event_id" className="input" defaultValue=""><option value="">—</option>{(events ?? []).map((e) => <option key={e.id} value={e.id}>{fmtDate(e.starts_at, lang)} · {e.title}</option>)}</select>
            </Field>
            {c.isAdmin && (
              <Field label={t('Chapter', 'शाखा')}>
                <select name="chapter" className="input" defaultValue="all"><option value="all">{t('All chapters', 'सभी शाखाएँ')}</option>{(chapters ?? []).map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</select>
              </Field>
            )}
            <Field label={t('YouTube link for video (optional)', 'वीडियो का YouTube लिंक (वैकल्पिक)')}><input name="video_url" type="url" className="input" /></Field>
          </div>
          <div><Submit className="btn-gold">{t('Create and add photos', 'बनाएँ और फोटो जोड़ें')}</Submit></div>
        </form>
      )}
    </>
  );
}

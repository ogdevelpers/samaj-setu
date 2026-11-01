import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/ctx';
import { deleteAlbum, deletePhoto } from '../actions';
import { Empty, PageHead } from '@/components/ui';
import { Submit } from '@/components/submit';
import { PhotoUploader } from '@/components/photo-uploader';
import { Lightbox } from '@/components/lightbox';
import { fmtDate } from '@/lib/utils';

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await requireMember();
  const { t, lang, sb } = c;
  const { data: album } = await sb.from('albums').select('*, chapter:chapters(name)').eq('id', id).maybeSingle();
  if (!album) notFound();
  const { data: photos } = await sb.from('photos').select('id,path,thumb_path').eq('album_id', id).order('created_at');
  const paths = (photos ?? []).flatMap((p) => [p.path, p.thumb_path]);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await sb.storage.from('gallery').createSignedUrls(paths, 3600);
    (signed ?? []).forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  const canEdit = c.isAdmin || (c.isCoordinator && album.chapter_id === c.myChapter);

  return (
    <>
      <PageHead kicker={`${fmtDate(album.event_date, lang, { day: 'numeric', month: 'long', year: 'numeric' })} · ${album.chapter?.name ?? t('All chapters', 'सभी शाखाएँ')}`} title={album.title}>
        <Link href="/gallery" className="btn-alt btn btn-sm">← {t('All albums', 'सभी एल्बम')}</Link>
      </PageHead>
      {album.video_url && <p><a className="font-semibold text-brand underline" href={album.video_url} target="_blank" rel="noreferrer">▶ {t('Watch the video', 'वीडियो देखें')}</a></p>}
      {canEdit && (
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <PhotoUploader albumId={id} labels={{ pick: t('+ Add photos', '+ फोटो जोड़ें'), busy: t('Uploading', 'अपलोड हो रहा है'), done: t('Uploaded', 'अपलोड हुईं') }} />
          <form action={deleteAlbum}><input type="hidden" name="id" value={id} /><Submit className="btn-bad btn btn-sm">{t('Delete album', 'एल्बम हटाएँ')}</Submit></form>
        </div>
      )}
      {(photos ?? []).length === 0 ? (
        <Empty>{t('No photos yet.', 'अभी कोई फोटो नहीं।')}</Empty>
      ) : (
        <Lightbox closeLabel={t('Close', 'बंद करें')} photos={(photos ?? []).map((p) => ({
          id: p.id, thumb: urls.get(p.thumb_path) ?? '', full: urls.get(p.path) ?? '',
          remove: canEdit ? (
            <form action={deletePhoto}><input type="hidden" name="id" value={p.id} /><button className="rounded-md bg-bad-soft px-2 py-0.5 text-xs font-bold text-bad" aria-label="Delete photo">✕</button></form>
          ) : undefined,
        }))} />
      )}
    </>
  );
}

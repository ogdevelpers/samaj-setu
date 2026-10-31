'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { str, strOrNull } from '@/lib/utils';

export async function createAlbum(fd: FormData) {
  const c = await getCtx();
  if (!c.canPost) redirect('/gallery');
  const chapter = c.isAdmin ? (strOrNull(fd.get('chapter')) === 'all' ? null : strOrNull(fd.get('chapter'))) : c.myChapter;
  const { data, error } = await c.sb
    .from('albums')
    .insert({
      title: str(fd.get('title')), event_date: str(fd.get('event_date')), chapter_id: chapter,
      event_id: strOrNull(fd.get('event_id')), video_url: strOrNull(fd.get('video_url')), created_by: c.user.id,
    })
    .select('id')
    .single();
  if (error || !data) redirect(`/gallery?err=${encodeURIComponent(error?.message ?? 'Failed')}`);
  redirect(`/gallery/${data!.id}`);
}

export async function deletePhoto(fd: FormData) {
  const c = await getCtx();
  const id = str(fd.get('id'));
  const { data: p } = await c.sb.from('photos').select('path,thumb_path,album_id').eq('id', id).maybeSingle();
  if (p) {
    await c.sb.storage.from('gallery').remove([p.path, p.thumb_path]);
    await c.sb.from('photos').delete().eq('id', id);
    revalidatePath(`/gallery/${p.album_id}`);
  }
}

export async function deleteAlbum(fd: FormData) {
  const c = await getCtx();
  const id = str(fd.get('id'));
  const { data: ps } = await c.sb.from('photos').select('path,thumb_path').eq('album_id', id);
  if (ps?.length) await c.sb.storage.from('gallery').remove(ps.flatMap((p) => [p.path, p.thumb_path]));
  await c.sb.from('albums').delete().eq('id', id);
  redirect('/gallery');
}

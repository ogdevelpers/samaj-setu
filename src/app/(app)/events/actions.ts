'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { str, strOrNull } from '@/lib/utils';

export async function toggleRsvp(fd: FormData) {
  const c = await getCtx();
  const id = str(fd.get('id'));
  const { data } = await c.sb.from('rsvps').select('event_id').eq('event_id', id).eq('user_id', c.user.id).maybeSingle();
  if (data) await c.sb.from('rsvps').delete().eq('event_id', id).eq('user_id', c.user.id);
  else await c.sb.from('rsvps').insert({ event_id: id, user_id: c.user.id });
  revalidatePath('/events');
}

/** Coordinators post for their chapter; the admin can post for everyone or one chapter. */
function scope(c: Awaited<ReturnType<typeof getCtx>>, fd: FormData) {
  if (c.isAdmin) return strOrNull(fd.get('chapter')) === 'all' ? null : strOrNull(fd.get('chapter'));
  return c.myChapter;
}

export async function createEvent(fd: FormData) {
  const c = await getCtx();
  if (!c.canPost) redirect('/events');
  const when = str(fd.get('starts_at'));
  const { error } = await c.sb.from('events').insert({
    title: str(fd.get('title')), description: strOrNull(fd.get('description')), venue: strOrNull(fd.get('venue')),
    starts_at: new Date(when).toISOString(), category: str(fd.get('category')) || 'function', chapter_id: scope(c, fd), created_by: c.user.id,
  });
  if (error) redirect(`/events?err=${encodeURIComponent(error.message)}`);
  revalidatePath('/events');
  redirect(`/events?ok=${encodeURIComponent(c.t('Event announced.', 'कार्यक्रम घोषित किया गया।'))}`);
}

export async function createNotice(fd: FormData) {
  const c = await getCtx();
  if (!c.canPost) redirect('/events');
  const { error } = await c.sb.from('notices').insert({
    title: str(fd.get('title')), body: strOrNull(fd.get('body')), category: str(fd.get('category')) || 'general',
    chapter_id: scope(c, fd), created_by: c.user.id,
  });
  if (error) redirect(`/events?err=${encodeURIComponent(error.message)}`);
  revalidatePath('/events');
  redirect(`/events?ok=${encodeURIComponent(c.t('Notice posted.', 'सूचना प्रकाशित की गई।'))}`);
}

export async function deleteItem(fd: FormData) {
  const c = await getCtx();
  const table = str(fd.get('table')) === 'notices' ? 'notices' : 'events';
  await c.sb.from(table).delete().eq('id', str(fd.get('id')));
  revalidatePath('/events');
}

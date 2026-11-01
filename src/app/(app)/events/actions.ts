'use server';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { str } from '@/lib/utils';

export async function toggleRsvp(fd: FormData) {
  const c = await getCtx();
  const id = str(fd.get('id'));
  const { data } = await c.sb.from('rsvps').select('event_id').eq('event_id', id).eq('user_id', c.user.id).maybeSingle();
  if (data) await c.sb.from('rsvps').delete().eq('event_id', id).eq('user_id', c.user.id);
  else await c.sb.from('rsvps').insert({ event_id: id, user_id: c.user.id });
  revalidatePath('/events');
}


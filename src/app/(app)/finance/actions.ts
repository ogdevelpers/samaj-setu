'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { currentFy, str, strOrNull } from '@/lib/utils';

async function guard() {
  const c = await getCtx();
  if (!(c.isAdmin || c.isTreasurer)) redirect('/');
  return c;
}
const done = (m: string, k: 'ok' | 'err' = 'ok') => redirect(`/finance?${k}=${encodeURIComponent(m)}`);

export async function confirmPayment(fd: FormData) {
  const c = await guard();
  const { error } = await c.sb.from('payments').update({ status: 'confirmed' }).eq('id', str(fd.get('id'))).eq('status', 'pending');
  if (error) done(error.message, 'err');
  revalidatePath('/finance');
  done(c.t('Confirmed. The receipt is ready for the family.', 'पुष्टि हो गई। परिवार के लिए रसीद तैयार है।'));
}

export async function rejectPayment(fd: FormData) {
  const c = await guard();
  const { error } = await c.sb.from('payments').update({ status: 'rejected', note: strOrNull(fd.get('note')) }).eq('id', str(fd.get('id'))).eq('status', 'pending');
  if (error) done(error.message, 'err');
  revalidatePath('/finance');
  done(c.t('Returned to the family.', 'परिवार को लौटा दिया गया।'));
}

export async function recordPayment(fd: FormData) {
  const c = await guard();
  const amount = Number(str(fd.get('amount')));
  if (!(amount > 0)) done(c.t('Enter an amount.', 'राशि लिखें।'), 'err');
  const kind = ['dues', 'occasion', 'donation'].includes(str(fd.get('kind'))) ? str(fd.get('kind')) : 'dues';
  const { error } = await c.sb.from('payments').insert({
    household_id: str(fd.get('household')), fy: currentFy(), kind, amount, mode: str(fd.get('mode')) === 'bank' ? 'bank' : 'cash',
    utr: strOrNull(fd.get('ref')), occasion: kind === 'occasion' ? strOrNull(fd.get('occasion')) : null,
    visibility: 'name', label: strOrNull(fd.get('label')), status: 'confirmed', created_by: c.user.id,
  });
  if (error) done(error.message, 'err');
  revalidatePath('/finance');
  done(c.t('Payment recorded and receipt issued.', 'भुगतान दर्ज हुआ और रसीद जारी हुई।'));
}

export async function addExpense(fd: FormData) {
  const c = await guard();
  const amount = Number(str(fd.get('amount')));
  if (!(amount > 0)) done(c.t('Enter an amount.', 'राशि लिखें।'), 'err');
  const chapter = c.isAdmin ? (strOrNull(fd.get('chapter')) === 'all' ? null : strOrNull(fd.get('chapter'))) : c.myChapter;
  const { error } = await c.sb.from('expenses').insert({
    chapter_id: chapter, spent_on: str(fd.get('spent_on')) || new Date().toISOString().slice(0, 10),
    description: str(fd.get('description')), category: str(fd.get('category')) || 'general', amount, created_by: c.user.id,
  });
  if (error) done(error.message, 'err');
  revalidatePath('/finance');
  done(c.t('Expense recorded.', 'खर्च दर्ज हुआ।'));
}

export async function deleteExpense(fd: FormData) {
  const c = await guard();
  await c.sb.from('expenses').delete().eq('id', str(fd.get('id')));
  revalidatePath('/finance');
}

export async function setFee(fd: FormData) {
  const c = await getCtx();
  if (!c.isAdmin) redirect('/');
  const { error } = await c.sb.from('fee_years').upsert({ fy: str(fd.get('fy')), per_member: Number(str(fd.get('per_member'))) });
  if (error) done(error.message, 'err');
  revalidatePath('/finance');
  done(c.t('Yearly fee saved.', 'वार्षिक शुल्क सहेजा गया।'));
}

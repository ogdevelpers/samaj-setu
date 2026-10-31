'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { str, strOrNull } from '@/lib/utils';

async function coordinator() {
  const c = await getCtx();
  if (!c.canPost) redirect('/');
  return c;
}
async function admin() {
  const c = await getCtx();
  if (!c.isAdmin) redirect('/');
  return c;
}
const done = (tab: string, m: string, k: 'ok' | 'err' = 'ok') => redirect(`/admin?tab=${tab}&${k}=${encodeURIComponent(m)}`);

export async function approveHousehold(fd: FormData) {
  const c = await coordinator();
  const { error } = await c.sb.from('households').update({ status: 'approved', reject_note: null }).eq('id', str(fd.get('id')));
  if (error) done('approvals', error.message, 'err');
  revalidatePath('/admin');
  done('approvals', c.t('Approved. The family can now use the portal.', 'स्वीकृत। परिवार अब पोर्टल का उपयोग कर सकता है।'));
}

export async function rejectHousehold(fd: FormData) {
  const c = await coordinator();
  const { error } = await c.sb.from('households').update({ status: 'rejected', reject_note: strOrNull(fd.get('note')) }).eq('id', str(fd.get('id')));
  if (error) done('approvals', error.message, 'err');
  revalidatePath('/admin');
  done('approvals', c.t('Returned to the family.', 'परिवार को लौटा दिया गया।'));
}

export async function setWaiver(fd: FormData) {
  const c = await coordinator();
  const { error } = await c.sb.from('households').update({ waiver_amount: Number(str(fd.get('waiver')) || 0) }).eq('id', str(fd.get('id')));
  if (error) done('households', error.message, 'err');
  revalidatePath('/admin');
  done('households', c.t('Waiver saved.', 'छूट सहेजी गई।'));
}

export async function createChapter(fd: FormData) {
  const c = await admin();
  const { error } = await c.sb.from('chapters').insert({ name: str(fd.get('name')), state: str(fd.get('state')), district: str(fd.get('district')), area: str(fd.get('area')) });
  if (error) done('chapters', error.message, 'err');
  revalidatePath('/admin');
  done('chapters', c.t('Chapter added.', 'शाखा जोड़ी गई।'));
}

export async function setRole(fd: FormData) {
  const c = await admin();
  const role = ['member', 'treasurer', 'coordinator', 'admin'].includes(str(fd.get('role'))) ? str(fd.get('role')) : 'member';
  const { error } = await c.sb.from('profiles').update({ role, chapter_id: strOrNull(fd.get('chapter')) }).eq('id', str(fd.get('id')));
  if (error) done('users', error.message, 'err');
  revalidatePath('/admin');
  done('users', c.t('Role saved.', 'भूमिका सहेजी गई।'));
}

export async function createScholarship(fd: FormData) {
  const c = await admin();
  const { error } = await c.sb.from('scholarships').insert({
    title: str(fd.get('title')), description: strOrNull(fd.get('description')),
    amount: str(fd.get('amount')) ? Number(str(fd.get('amount'))) : null, deadline: strOrNull(fd.get('deadline')),
  });
  if (error) done('content', error.message, 'err');
  revalidatePath('/admin');
  done('content', c.t('Scholarship added.', 'छात्रवृत्ति जोड़ी गई।'));
}

export async function reviewApplication(fd: FormData) {
  const c = await admin();
  await c.sb.from('scholarship_applications').update({ status: str(fd.get('status')) === 'approved' ? 'approved' : 'declined' }).eq('id', str(fd.get('id')));
  revalidatePath('/admin');
  done('content', c.t('Saved.', 'सहेजा गया।'));
}

export async function approveListing(fd: FormData) {
  const c = await coordinator();
  await c.sb.from('listings').update({ approved: true }).eq('id', str(fd.get('id')));
  revalidatePath('/admin');
  done('content', c.t('Approved.', 'स्वीकृत।'));
}

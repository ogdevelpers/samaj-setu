'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { str, strOrNull } from '@/lib/utils';

export async function postListing(fd: FormData) {
  const c = await getCtx();
  const kind = ['business', 'job', 'vivah'].includes(str(fd.get('kind'))) ? str(fd.get('kind')) : 'business';
  const chapter = c.myChapter ?? c.household?.chapter_id;
  if (!chapter) redirect(`/community?tab=${kind === 'vivah' ? 'vivah' : 'biz'}&err=${encodeURIComponent('No chapter')}`);
  const { error } = await c.sb.from('listings').insert({
    kind, title: str(fd.get('title')), body: strOrNull(fd.get('body')), contact: strOrNull(fd.get('contact')), chapter_id: chapter, created_by: c.user.id, approved: false,
  });
  const tab = kind === 'vivah' ? 'vivah' : 'biz';
  if (error) redirect(`/community?tab=${tab}&err=${encodeURIComponent(error.message)}`);
  revalidatePath('/community');
  redirect(`/community?tab=${tab}&ok=${encodeURIComponent(c.t('Sent to your coordinator for approval.', 'स्वीकृति के लिए आपके संयोजक को भेजा गया।'))}`);
}

export async function applyScholarship(fd: FormData) {
  const c = await getCtx();
  const { error } = await c.sb.from('scholarship_applications').insert({
    scholarship_id: str(fd.get('scholarship')), applicant_id: c.user.id, student_name: str(fd.get('student')),
    institution: strOrNull(fd.get('institution')), marks: strOrNull(fd.get('marks')), note: strOrNull(fd.get('note')),
  });
  if (error) redirect(`/community?tab=edu&err=${encodeURIComponent(error.message)}`);
  redirect(`/community?tab=edu&ok=${encodeURIComponent(c.t('Application submitted.', 'आवेदन जमा हो गया।'))}`);
}

export async function deleteListing(fd: FormData) {
  const c = await getCtx();
  await c.sb.from('listings').delete().eq('id', str(fd.get('id')));
  revalidatePath('/community');
}

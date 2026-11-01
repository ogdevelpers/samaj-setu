'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/ctx';
import { currentFy, str, strOrNull } from '@/lib/utils';

const done = (path: string, m: string, k: 'ok' | 'err' = 'ok') => redirect(`${path}?${k}=${encodeURIComponent(m)}`);
const POST = ['admin', 'coordinator'];
const MONEY = ['admin', 'treasurer'];

/* ---------- approvals and families ---------- */
export async function approveHousehold(fd: FormData) {
  const c = await requireStaff(POST);
  const { error } = await c.sb.from('households').update({ status: 'approved', reject_note: null }).eq('id', str(fd.get('id')));
  if (error) done('/admin/approvals', error.message, 'err');
  revalidatePath('/admin', 'layout');
  done('/admin/approvals', c.t('Approved. The family can now use the portal.', 'स्वीकृत। परिवार अब पोर्टल का उपयोग कर सकता है।'));
}

export async function rejectHousehold(fd: FormData) {
  const c = await requireStaff(POST);
  const { error } = await c.sb.from('households').update({ status: 'rejected', reject_note: strOrNull(fd.get('note')) }).eq('id', str(fd.get('id')));
  if (error) done('/admin/approvals', error.message, 'err');
  revalidatePath('/admin', 'layout');
  done('/admin/approvals', c.t('Returned to the family.', 'परिवार को लौटा दिया गया।'));
}

export async function setWaiver(fd: FormData) {
  const c = await requireStaff(POST);
  const { error } = await c.sb.from('households').update({ waiver_amount: Number(str(fd.get('waiver')) || 0) }).eq('id', str(fd.get('id')));
  if (error) done('/admin/families', error.message, 'err');
  done('/admin/families', c.t('Waiver saved.', 'छूट सहेजी गई।'));
}

/* ---------- places and people ---------- */
export async function createChapter(fd: FormData) {
  const c = await requireStaff(['admin']);
  const district = str(fd.get('district'));
  const area = str(fd.get('area'));
  const { error } = await c.sb.from('chapters').insert({ name: str(fd.get('name')) || (district === area ? area : `${district} - ${area}`), state: str(fd.get('state')), district, area });
  if (error) done('/admin/chapters', error.message, 'err');
  revalidatePath('/admin', 'layout');
  done('/admin/chapters', c.t('Place added.', 'स्थान जोड़ा गया।'));
}

export async function deleteChapter(fd: FormData) {
  const c = await requireStaff(['admin']);
  const { error } = await c.sb.from('chapters').delete().eq('id', str(fd.get('id')));
  if (error) done('/admin/chapters', c.t('This place has families, so it cannot be removed.', 'इस स्थान पर परिवार हैं, इसलिए इसे हटाया नहीं जा सकता।'), 'err');
  done('/admin/chapters', c.t('Place removed.', 'स्थान हटाया गया।'));
}

export async function setRole(fd: FormData) {
  const c = await requireStaff(['admin']);
  const role = ['member', 'treasurer', 'coordinator', 'admin'].includes(str(fd.get('role'))) ? str(fd.get('role')) : 'member';
  const chapter = strOrNull(fd.get('chapter'));
  if ((role === 'coordinator' || role === 'treasurer') && !chapter) done('/admin/people', c.t('Choose the place for this coordinator or treasurer.', 'इस संयोजक या कोषाध्यक्ष के लिए स्थान चुनें।'), 'err');
  const { error } = await c.sb.from('profiles').update({ role, chapter_id: chapter }).eq('id', str(fd.get('id')));
  if (error) done('/admin/people', error.message, 'err');
  revalidatePath('/admin', 'layout');
  done('/admin/people', c.t('Role saved. They may need to sign in again.', 'भूमिका सहेजी गई। उन्हें दोबारा साइन इन करना पड़ सकता है।'));
}

/* ---------- announcements ---------- */
function scope(c: Awaited<ReturnType<typeof requireStaff>>, fd: FormData) {
  if (c.isAdmin) return strOrNull(fd.get('chapter')) === 'all' ? null : strOrNull(fd.get('chapter'));
  return c.myChapter;
}

export async function createEvent(fd: FormData) {
  const c = await requireStaff(POST);
  const { error } = await c.sb.from('events').insert({
    title: str(fd.get('title')), description: strOrNull(fd.get('description')), venue: strOrNull(fd.get('venue')),
    starts_at: new Date(str(fd.get('starts_at'))).toISOString(), category: str(fd.get('category')) || 'function', chapter_id: scope(c, fd), created_by: c.user.id,
  });
  if (error) done('/admin/announcements', error.message, 'err');
  revalidatePath('/admin/announcements');
  done('/admin/announcements', c.t('Event announced. Members can see it now.', 'कार्यक्रम घोषित हुआ। सदस्य अब इसे देख सकते हैं।'));
}

export async function createNotice(fd: FormData) {
  const c = await requireStaff(POST);
  const { error } = await c.sb.from('notices').insert({
    title: str(fd.get('title')), body: strOrNull(fd.get('body')), category: str(fd.get('category')) || 'general', chapter_id: scope(c, fd), created_by: c.user.id,
  });
  if (error) done('/admin/announcements', error.message, 'err');
  revalidatePath('/admin/announcements');
  done('/admin/announcements', c.t('Notice posted.', 'सूचना प्रकाशित की गई।'));
}

export async function deleteItem(fd: FormData) {
  const c = await requireStaff(POST);
  await c.sb.from(str(fd.get('table')) === 'notices' ? 'notices' : 'events').delete().eq('id', str(fd.get('id')));
  revalidatePath('/admin/announcements');
  done('/admin/announcements', c.t('Deleted.', 'हटाया गया।'));
}

/* ---------- listings and scholarships ---------- */
export async function approveListing(fd: FormData) {
  const c = await requireStaff(POST);
  await c.sb.from('listings').update({ approved: true }).eq('id', str(fd.get('id')));
  revalidatePath('/admin', 'layout');
  done('/admin/community', c.t('Approved.', 'स्वीकृत।'));
}

export async function createScholarship(fd: FormData) {
  const c = await requireStaff(['admin']);
  const { error } = await c.sb.from('scholarships').insert({
    title: str(fd.get('title')), description: strOrNull(fd.get('description')),
    amount: str(fd.get('amount')) ? Number(str(fd.get('amount'))) : null, deadline: strOrNull(fd.get('deadline')),
  });
  if (error) done('/admin/community', error.message, 'err');
  done('/admin/community', c.t('Scholarship added.', 'छात्रवृत्ति जोड़ी गई।'));
}

export async function reviewApplication(fd: FormData) {
  const c = await requireStaff(['admin']);
  await c.sb.from('scholarship_applications').update({ status: str(fd.get('status')) === 'approved' ? 'approved' : 'declined' }).eq('id', str(fd.get('id')));
  done('/admin/community', c.t('Saved.', 'सहेजा गया।'));
}

/* ---------- settings ---------- */
export async function saveSettings(fd: FormData) {
  const c = await requireStaff(['admin']);
  const rows = ['upi_id', 'upi_name', 'help_phone'].map((key) => ({ key, value: str(fd.get(key)) }));
  const { error } = await c.sb.from('settings').upsert(rows);
  if (error) done('/admin/settings', error.message, 'err');
  const fee = str(fd.get('per_member'));
  if (fee) {
    const { error: e2 } = await c.sb.from('fee_years').upsert({ fy: currentFy(), per_member: Number(fee) });
    if (e2) done('/admin/settings', e2.message, 'err');
  }
  revalidatePath('/admin', 'layout');
  done('/admin/settings', c.t('Settings saved.', 'सेटिंग सहेजी गई।'));
}

/* ---------- finance ---------- */
export async function confirmPayment(fd: FormData) {
  const c = await requireStaff(MONEY);
  const { error } = await c.sb.from('payments').update({ status: 'confirmed' }).eq('id', str(fd.get('id'))).eq('status', 'pending');
  if (error) done('/admin/finance', error.message, 'err');
  revalidatePath('/admin', 'layout');
  done('/admin/finance', c.t('Confirmed. The receipt is ready for the family.', 'पुष्टि हो गई। परिवार के लिए रसीद तैयार है।'));
}

export async function rejectPayment(fd: FormData) {
  const c = await requireStaff(MONEY);
  const { error } = await c.sb.from('payments').update({ status: 'rejected', note: strOrNull(fd.get('note')) }).eq('id', str(fd.get('id'))).eq('status', 'pending');
  if (error) done('/admin/finance', error.message, 'err');
  revalidatePath('/admin', 'layout');
  done('/admin/finance', c.t('Returned to the family.', 'परिवार को लौटा दिया गया।'));
}

export async function recordPayment(fd: FormData) {
  const c = await requireStaff(MONEY);
  const amount = Number(str(fd.get('amount')));
  if (!(amount > 0)) done('/admin/finance', c.t('Enter an amount.', 'राशि लिखें।'), 'err');
  const kind = ['dues', 'occasion', 'donation'].includes(str(fd.get('kind'))) ? str(fd.get('kind')) : 'dues';
  const { error } = await c.sb.from('payments').insert({
    household_id: str(fd.get('household')), fy: currentFy(), kind, amount, mode: str(fd.get('mode')) === 'bank' ? 'bank' : 'cash',
    utr: strOrNull(fd.get('ref')), occasion: kind === 'occasion' ? strOrNull(fd.get('occasion')) : null,
    visibility: 'name', label: strOrNull(fd.get('label')), status: 'confirmed', created_by: c.user.id,
  });
  if (error) done('/admin/finance', error.message, 'err');
  done('/admin/finance', c.t('Payment recorded and receipt issued.', 'भुगतान दर्ज हुआ और रसीद जारी हुई।'));
}

export async function addExpense(fd: FormData) {
  const c = await requireStaff(MONEY);
  const amount = Number(str(fd.get('amount')));
  if (!(amount > 0)) done('/admin/finance', c.t('Enter an amount.', 'राशि लिखें।'), 'err');
  const chapter = c.isAdmin ? (strOrNull(fd.get('chapter')) === 'all' ? null : strOrNull(fd.get('chapter'))) : c.myChapter;
  const { error } = await c.sb.from('expenses').insert({
    chapter_id: chapter, spent_on: str(fd.get('spent_on')) || new Date().toISOString().slice(0, 10),
    description: str(fd.get('description')), category: str(fd.get('category')) || 'general', amount, created_by: c.user.id,
  });
  if (error) done('/admin/finance', error.message, 'err');
  done('/admin/finance', c.t('Expense recorded.', 'खर्च दर्ज हुआ।'));
}

export async function deleteExpense(fd: FormData) {
  const c = await requireStaff(MONEY);
  await c.sb.from('expenses').delete().eq('id', str(fd.get('id')));
  done('/admin/finance', c.t('Expense removed.', 'खर्च हटाया गया।'));
}

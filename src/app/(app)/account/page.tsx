import { getCtx } from '@/lib/ctx';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { str } from '@/lib/utils';

async function saveAccount(fd: FormData) {
  'use server';
  const c = await getCtx();
  const pw = str(fd.get('password'));
  if (pw && pw.length < 8) redirect(`/account?err=${encodeURIComponent(c.t('Password must be at least 8 characters.', 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए।'))}`);
  await c.sb.from('profiles').update({ full_name: str(fd.get('name')) }).eq('id', c.user.id);
  if (pw) await c.sb.auth.updateUser({ password: pw });
  revalidatePath('/account');
  redirect(`/account?ok=${encodeURIComponent(c.t('Saved.', 'सहेजा गया।'))}`);
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await getCtx();
  const { t } = c;
  const roleName: Record<string, string> = { member: t('Member', 'सदस्य'), treasurer: t('Treasurer', 'कोषाध्यक्ष'), coordinator: t('Coordinator', 'संयोजक'), admin: t('Central admin', 'केंद्रीय प्रबंधक') };
  return (
    <>
      <PageHead title={t('My account', 'मेरा खाता')} sub={`${c.user.email} · ${roleName[c.role]}`} />
      <Flash ok={sp.ok} err={sp.err} />
      <section className="card flex flex-col gap-2">
        <h2>{t('Your status', 'आपकी स्थिति')}</h2>
        <p><span className="text-muted">{t('Signed in as', 'साइन इन')}:</span> <b>{c.user.email}</b></p>
        <p><span className="text-muted">{t('Role', 'भूमिका')}:</span> <b>{roleName[c.role]}</b></p>
        <p><span className="text-muted">{t('Family', 'परिवार')}:</span> <b>{!c.household ? t('Not registered yet', 'अभी पंजीकृत नहीं') : c.household.status === 'approved' ? t('Approved', 'स्वीकृत') : c.household.status === 'pending' ? t('Waiting for approval', 'स्वीकृति की प्रतीक्षा') : t('Returned. Please fix and resend.', 'लौटाया गया। कृपया सुधारकर फिर भेजें।')}</b></p>
      </section>
      <form action={saveAccount} className="card flex max-w-xl flex-col gap-3">
        <Field label={t('Your name', 'आपका नाम')}><input name="name" defaultValue={c.profile?.full_name ?? ''} className="input" /></Field>
        <Field label={t('New password (leave empty to keep)', 'नया पासवर्ड (न बदलना हो तो खाली छोड़ें)')}><input name="password" type="password" minLength={8} autoComplete="new-password" className="input" /></Field>
        <div><Submit>{t('Save', 'सहेजें')}</Submit></div>
      </form>
    </>
  );
}

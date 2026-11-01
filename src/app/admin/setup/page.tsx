import Link from 'next/link';
import { redirect } from 'next/navigation';
import { setupAdmin } from '../actions';
import { Flash } from '@/components/ui';
import { Submit } from '@/components/submit';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n';

export default async function AdminSetup({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const { t } = await getT();
  const sb = await createClient();
  const { data: has } = await sb.rpc('has_admin');
  if (has) redirect('/admin/login');
  const needCode = !!process.env.ADMIN_SETUP_CODE;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-4 py-10">
      <Flash err={sp.err} />
      <div className="card flex flex-col gap-4">
        <div><h1 className="!text-2xl">{t('Set up your portal', 'अपना पोर्टल सेट करें')}</h1>
          <p className="mt-1 text-sm text-muted">{t('Create the first admin account. After this, you will add places, the yearly fee and the UPI ID.', 'पहला प्रबंधक खाता बनाएँ। इसके बाद आप स्थान, वार्षिक शुल्क और UPI ID जोड़ेंगे।')}</p></div>
        <form action={setupAdmin} className="flex flex-col gap-3">
          <div className="field"><label htmlFor="name">{t('Your name', 'आपका नाम')}</label><input id="name" name="name" required className="input" /></div>
          <div className="field"><label htmlFor="email">{t('Email', 'ईमेल')}</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div className="field"><label htmlFor="password">{t('Password (8 or more characters)', 'पासवर्ड (8 या अधिक अक्षर)')}</label><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="input" /></div>
          {needCode && <div className="field"><label htmlFor="code">{t('Setup code', 'सेटअप कोड')}</label><input id="code" name="code" required className="input" /></div>}
          <Submit className="btn-gold">{t('Create admin account', 'प्रबंधक खाता बनाएँ')}</Submit>
        </form>
      </div>
      <Link href="/admin/login" className="text-center text-sm font-semibold text-brand underline">← {t('Back to admin sign-in', 'प्रबंधक साइन इन पर लौटें')}</Link>
    </main>
  );
}

import Link from 'next/link';
import { adminLogin } from '../actions';
import { Flash } from '@/components/ui';
import { Submit } from '@/components/submit';
import { LangToggle } from '@/components/lang-toggle';
import { Icon } from '@/components/icon';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n';

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const { t } = await getT();
  const sb = await createClient();
  const { data: has } = await sb.rpc('has_admin');
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-4 py-10">
      <Flash err={sp.err} />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-xl"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-brand-ink"><Icon name="shield" /></span>{t('Admin console', 'प्रबंधन')}</span>
        <LangToggle next="/admin/login" />
      </div>
      <div className="card flex flex-col gap-4">
        <div><h1 className="!text-2xl">{t('Admin sign-in', 'प्रबंधक साइन इन')}</h1>
          <p className="mt-1 text-sm text-muted">{t('For the committee: admin, coordinators and treasurers.', 'समिति के लिए: प्रबंधक, संयोजक और कोषाध्यक्ष।')}</p></div>
        <form action={adminLogin} className="flex flex-col gap-3">
          <div className="field"><label htmlFor="email">{t('Email', 'ईमेल')}</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div className="field"><label htmlFor="password">{t('Password', 'पासवर्ड')}</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
          <Submit>{t('Sign in', 'साइन इन')}</Submit>
        </form>
      </div>
      {!has && (
        <div className="card-flat flex flex-col gap-2">
          <b>{t('First time setting up this portal?', 'क्या यह पोर्टल पहली बार सेट कर रहे हैं?')}</b>
          <p className="text-sm text-muted">{t('No admin exists yet. The first person to set up becomes the admin.', 'अभी कोई प्रबंधक नहीं है। सबसे पहले सेटअप करने वाला प्रबंधक बनेगा।')}</p>
          <Link href="/admin/setup" className="btn-gold btn w-fit">{t('Set up the portal', 'पोर्टल सेट करें')}</Link>
        </div>
      )}
      <Link href="/" className="text-center text-sm font-semibold text-brand underline">← {t('Back to the member portal', 'सदस्य पोर्टल पर लौटें')}</Link>
    </main>
  );
}

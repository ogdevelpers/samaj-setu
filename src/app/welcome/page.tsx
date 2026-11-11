import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSetupState } from '@/lib/setup';
import { getT } from '@/lib/i18n';
import { LangToggle } from '@/components/lang-toggle';
import { Icon } from '@/components/icon';
import { ORG_EN, ORG_HI } from '@/lib/utils';

export default async function Welcome() {
  const { t, lang } = await getT();
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (data.user) redirect('/');
  const state = await getSetupState(sb);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <div className="flex justify-end"><LangToggle next="/welcome" /></div>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-brand font-display text-3xl text-brand-ink">श्री</span>
        <h1 className="!text-3xl md:!text-4xl">{lang === 'hi' ? ORG_HI : ORG_EN}</h1>
        <p className="max-w-md text-lg text-muted">{t('Our community in one place: families, events, photos and yearly contributions.', 'हमारा समाज एक जगह: परिवार, कार्यक्रम, फोटो और वार्षिक सहयोग।')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card flex flex-col gap-4 !p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon name="family" className="h-8 w-8" /></span>
          <div><h2 className="!text-xl">{t('I am a member', 'मैं समाज का सदस्य हूँ')}</h2>
            <p className="mt-1 text-muted">{t('See events and photos, manage your family, pay your dues.', 'कार्यक्रम और फोटो देखें, अपना परिवार संभालें, शुल्क भरें।')}</p></div>
          <div className="mt-auto flex flex-col gap-2">
            <Link href="/login" className="btn !min-h-[52px] !text-lg">{t('Member sign in', 'सदस्य साइन इन')}</Link>
            <Link href="/signup" className="btn-alt btn !min-h-[52px] !text-lg">{t('Register my family', 'मेरा परिवार पंजीकृत करें')}</Link>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl bg-ink p-6 text-bg">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15"><Icon name="shield" className="h-8 w-8" /></span>
          <div><h2 className="!text-xl">{t('Committee login', 'समिति लॉगिन')}</h2>
            <p className="mt-1 opacity-75">{t('For the admin, place coordinators and treasurers.', 'प्रबंधक, स्थान संयोजक और कोषाध्यक्ष के लिए।')}</p></div>
          <div className="mt-auto"><Link href="/admin/login" className="btn-gold btn !min-h-[52px] w-full !text-lg">{t('Admin sign in', 'प्रबंधक साइन इन')}</Link></div>
        </section>
      </div>

      {state !== 'ready' && state !== 'no_env' && (
        <p className="text-center text-sm text-muted">{t('First time here?', 'पहली बार आए हैं?')} <Link href="/setup" className="font-semibold text-brand underline">{t('Set up this portal', 'यह पोर्टल सेट करें')}</Link></p>
      )}
      {state === 'no_env' && <p className="text-center text-sm"><Link href="/setup" className="font-semibold text-brand underline">{t('Set up this portal', 'यह पोर्टल सेट करें')}</Link></p>}
    </main>
  );
}

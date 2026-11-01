import Link from 'next/link';
import { signup } from '../actions';
import { AuthShell } from '@/components/auth-shell';
import { Flash } from '@/components/ui';
import { Submit } from '@/components/submit';
import { getT } from '@/lib/i18n';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const { t } = await getT();
  return (
    <AuthShell title={t('Create your account', 'अपना खाता बनाएँ')}>
      <p className="text-muted">
        {t('The head of the family signs up first, then registers the household and adds everyone in it.', 'परिवार के मुखिया पहले खाता बनाते हैं, फिर परिवार पंजीकृत करके सभी सदस्यों को जोड़ते हैं।')}
      </p>
      <Flash err={sp.err} />
      <form action={signup} className="flex flex-col gap-3">
        <div className="field">
          <label htmlFor="name">{t('Your full name', 'आपका पूरा नाम')}</label>
          <input id="name" name="name" required autoComplete="name" className="input" />
        </div>
        <div className="field">
          <label htmlFor="email">{t('Email', 'ईमेल')}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div className="field">
          <label htmlFor="password">{t('Password (8 or more characters)', 'पासवर्ड (8 या अधिक अक्षर)')}</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consent" required className="mt-1" />
          <span>{t('I agree that the samaj may store my family\'s information and show it only to verified members.', 'मैं सहमत हूँ कि समाज मेरे परिवार की जानकारी रखे और केवल सत्यापित सदस्यों को दिखाए।')}</span></label>
        <Submit>{t('Create account', 'खाता बनाएँ')}</Submit>
      </form>
      <p className="text-sm text-muted">
        {t('Already registered?', 'पहले से पंजीकृत हैं?')}{' '}
        <Link href="/login" className="font-semibold text-brand underline">{t('Sign in', 'साइन इन')}</Link>
      </p>
    </AuthShell>
  );
}

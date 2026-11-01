import Link from 'next/link';
import { login, forgotPassword } from '../actions';
import { AuthShell } from '@/components/auth-shell';
import { Flash } from '@/components/ui';
import { Submit } from '@/components/submit';
import { getT } from '@/lib/i18n';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { t } = await getT();
  return (
    <AuthShell title={t('Sign in', 'साइन इन')}>
      <Flash ok={sp.ok} err={sp.err} />
      <form action={login} className="flex flex-col gap-3">
        <div className="field">
          <label htmlFor="email">{t('Email', 'ईमेल')}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div className="field">
          <label htmlFor="password">{t('Password', 'पासवर्ड')}</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <Submit>{t('Sign in', 'साइन इन')}</Submit>
      </form>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">{t('Forgot password?', 'पासवर्ड भूल गए?')}</summary>
        <form action={forgotPassword} className="mt-3 flex flex-col gap-2">
          <input name="email" type="email" required placeholder={t('Your email', 'आपका ईमेल')} className="input" aria-label="Email" />
          <Submit className="btn-alt">{t('Send reset link', 'रीसेट लिंक भेजें')}</Submit>
        </form>
      </details>
      <p className="text-sm text-muted">
        {t('New family?', 'नया परिवार?')}{' '}
        <Link href="/signup" className="font-semibold text-brand underline">{t('Create an account', 'खाता बनाएँ')}</Link>
      </p>
      <p className="border-t border-line pt-3 text-sm text-muted">
        {t('Committee member?', 'समिति के सदस्य?')}{' '}
        <Link href="/admin/login" className="font-semibold text-brand underline">{t('Admin sign-in', 'प्रबंधक साइन इन')}</Link>
      </p>
    </AuthShell>
  );
}

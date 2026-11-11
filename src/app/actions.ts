'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n';
import { str } from '@/lib/utils';

const back = (path: string, key: 'ok' | 'err', msg: string) => redirect(`${path}?${key}=${encodeURIComponent(msg)}`);

export async function setLang(formData: FormData) {
  const lang = str(formData.get('lang')) === 'en' ? 'en' : 'hi';
  (await cookies()).set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (data.user) await sb.from('profiles').update({ lang }).eq('id', data.user.id);
  redirect(str(formData.get('next')) || '/');
}

export async function login(formData: FormData) {
  const { t } = await getT();
  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword({ email: str(formData.get('email')), password: str(formData.get('password')) });
  if (error) back('/login', 'err', t('Wrong email or password.', 'ईमेल या पासवर्ड गलत है।'));
  redirect('/');
}

export async function signup(formData: FormData) {
  const { t } = await getT();
  const sb = await createClient();
  const origin = (await headers()).get('origin') ?? '';
  const password = str(formData.get('password'));
  if (password.length < 8) back('/signup', 'err', t('Password must be at least 8 characters.', 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए।'));
  const { data, error } = await sb.auth.signUp({
    email: str(formData.get('email')),
    password,
    options: { data: { full_name: str(formData.get('name')) }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) back('/signup', 'err', error.message);
  if (!data.session) back('/login', 'ok', t('Check your email and tap the link to confirm, then sign in.', 'अपना ईमेल देखें और पुष्टि लिंक दबाएँ, फिर साइन इन करें।'));
  redirect('/register');
}

export async function forgotPassword(formData: FormData) {
  const { t } = await getT();
  const sb = await createClient();
  const origin = (await headers()).get('origin') ?? '';
  await sb.auth.resetPasswordForEmail(str(formData.get('email')), { redirectTo: `${origin}/auth/callback?next=/account` });
  back('/login', 'ok', t('If that email is registered, a reset link has been sent.', 'यदि यह ईमेल पंजीकृत है तो रीसेट लिंक भेज दिया गया है।'));
}

export async function signOut() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect('/welcome');
}

export async function signOutAdmin() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect('/admin/login');
}

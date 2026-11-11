'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n';
import { str } from '@/lib/utils';

const STAFF = ['admin', 'coordinator', 'treasurer'];
const back = (path: string, msg: string) => redirect(`${path}?err=${encodeURIComponent(msg)}`);

/** Say what actually went wrong, so the person knows whether to fix the password or confirm the email. */
function loginMessage(raw: string | undefined, t: (en: string, hi: string) => string) {
  if (raw && /confirm/i.test(raw)) return t('Please confirm your email first. Open the email we sent and tap the link.', 'पहले अपना ईमेल पुष्ट करें। भेजा गया ईमेल खोलकर लिंक दबाएँ।');
  if (raw && /rate|too many/i.test(raw)) return t('Too many tries. Wait a few minutes and try again.', 'बहुत बार कोशिश हुई। कुछ मिनट रुककर फिर कोशिश करें।');
  if (!raw || /invalid/i.test(raw)) return t('Wrong email or password. Use "Forgot password" below if needed.', 'ईमेल या पासवर्ड गलत है। जरूरत हो तो नीचे "पासवर्ड भूल गए" दबाएँ।');
  return raw;
}

export async function adminLogin(fd: FormData) {
  const { t } = await getT();
  const sb = await createClient();
  const { data, error } = await sb.auth.signInWithPassword({ email: str(fd.get('email')), password: str(fd.get('password')) });
  if (error || !data.user) back('/admin/login', loginMessage(error?.message, t));
  let { data: p } = await sb.from('profiles').select('role').eq('id', data!.user!.id).maybeSingle();
  if (!p) {
    await sb.rpc('ensure_profile');
    p = (await sb.from('profiles').select('role').eq('id', data!.user!.id).maybeSingle()).data;
  }
  if (!p || !STAFF.includes(p.role)) {
    const who = data!.user!.email;
    await sb.auth.signOut();
    back('/admin/login', t(`${who} is a member account, not an admin. Sign in with the admin email, or ask the admin to give you a role.`, `${who} सदस्य खाता है, प्रबंधक नहीं। प्रबंधक ईमेल से साइन इन करें, या प्रबंधक से भूमिका देने को कहें।`));
  }
  redirect('/admin');
}

/** The very first admin. Works only while no admin exists. */
export async function setupAdmin(fd: FormData) {
  const { t } = await getT();
  const sb = await createClient();
  const fail = (m: string) => back('/admin/setup', m);
  const { data: has, error: hasErr } = await sb.rpc('has_admin');
  if (hasErr) redirect('/setup');
  if (has) fail(t('An admin already exists. Please sign in.', 'प्रबंधक पहले से है। कृपया साइन इन करें।'));
  const need = process.env.ADMIN_SETUP_CODE;
  if (need && str(fd.get('code')) !== need) fail(t('The setup code is wrong.', 'सेटअप कोड गलत है।'));
  const email = str(fd.get('email'));
  const password = str(fd.get('password'));
  if (password.length < 8) fail(t('Password must be at least 8 characters.', 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए।'));
  const signedIn = await sb.auth.signInWithPassword({ email, password });
  if (signedIn.error) {
    const up = await sb.auth.signUp({ email, password, options: { data: { full_name: str(fd.get('name')) } } });
    if (up.error) fail(up.error.message);
    if (!up.data.session) fail(t('Account created. Open the confirmation email, then come back here and submit this page again.', 'खाता बन गया। पुष्टि ईमेल खोलें, फिर यहाँ लौटकर यह पेज फिर से भेजें।'));
  }
  const { data: ok, error: claimErr } = await sb.rpc('claim_first_admin');
  if (claimErr) redirect('/setup');
  if (!ok) fail(t('An admin already exists. Please use Admin sign-in.', 'प्रबंधक पहले से है। कृपया प्रबंधक साइन इन उपयोग करें।'));
  redirect('/admin?welcome=1');
}

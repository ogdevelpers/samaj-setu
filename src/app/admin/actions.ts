'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n';
import { str } from '@/lib/utils';

const STAFF = ['admin', 'coordinator', 'treasurer'];
const back = (path: string, msg: string) => redirect(`${path}?err=${encodeURIComponent(msg)}`);

export async function adminLogin(fd: FormData) {
  const { t } = await getT();
  const sb = await createClient();
  const { data, error } = await sb.auth.signInWithPassword({ email: str(fd.get('email')), password: str(fd.get('password')) });
  if (error || !data.user) back('/admin/login', t('Wrong email or password.', 'ईमेल या पासवर्ड गलत है।'));
  const { data: p } = await sb.from('profiles').select('role').eq('id', data!.user!.id).single();
  if (!p || !STAFF.includes(p.role)) {
    await sb.auth.signOut();
    back('/admin/login', t('This account is not an admin, coordinator or treasurer.', 'यह खाता प्रबंधक, संयोजक या कोषाध्यक्ष का नहीं है।'));
  }
  redirect('/admin');
}

/** The very first admin. Works only while no admin exists. */
export async function setupAdmin(fd: FormData) {
  const { t } = await getT();
  const sb = await createClient();
  const fail = (m: string) => back('/admin/setup', m);
  const { data: has } = await sb.rpc('has_admin');
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
  const { data: ok } = await sb.rpc('claim_first_admin');
  if (!ok) fail(t('Could not make you the admin. Someone else may have set up first.', 'आपको प्रबंधक नहीं बनाया जा सका। संभव है किसी और ने पहले सेटअप कर लिया।'));
  redirect('/admin?welcome=1');
}

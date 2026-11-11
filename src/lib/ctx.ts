import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { getT } from './i18n';

export async function getCtx() {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect('/welcome');
  const user = data.user;
  const load = () => sb
    .from('profiles')
    .select('*, household:households(id, status, chapter_id, head_name, waiver_amount, reject_note, chapter:chapters(name, area, district, state))')
    .eq('id', user.id)
    .maybeSingle();
  let { data: profile } = await load();
  if (!profile) {
    // an account made before the database was installed has no profile yet; create it
    await sb.rpc('ensure_profile');
    profile = (await load()).data;
  }
  if (profile && !profile.household_id) {
    // registered earlier but not linked to this account (older bug); link it now
    const { data: linked } = await sb.rpc('link_my_household');
    if (linked) profile = (await load()).data;
  }
  const { lang, t } = await getT();
  const role: string = profile?.role ?? 'member';
  const household = profile?.household ?? null;
  const isAdmin = role === 'admin';
  const isCoordinator = role === 'coordinator';
  const isTreasurer = role === 'treasurer';
  const isStaff = isAdmin || isCoordinator || isTreasurer;
  const isMember = isStaff || household?.status === 'approved';
  return {
    sb, user, profile, role, household, lang, t,
    isAdmin, isCoordinator, isTreasurer, isStaff, isMember,
    canPost: isAdmin || isCoordinator,
    canMoney: isAdmin || isTreasurer,
    myChapter: (profile?.chapter_id ?? null) as string | null,
  };
}

export type Ctx = Awaited<ReturnType<typeof getCtx>>;

/** For pages that only verified members may see. */
export async function requireMember() {
  const ctx = await getCtx();
  if (!ctx.isMember) redirect('/register');
  return ctx;
}

export async function requireRole(check: (c: Ctx) => boolean) {
  const ctx = await requireMember();
  if (!check(ctx)) redirect('/');
  return ctx;
}

/** Admin console pages. Members are sent back to the member app. */
export async function requireStaff(allow: string[] = ['admin', 'coordinator', 'treasurer']) {
  const ctx = await getCtx();
  if (!allow.includes(ctx.role)) redirect(ctx.isStaff ? '/admin' : '/');
  return ctx;
}

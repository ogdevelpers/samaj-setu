import type { SupabaseClient } from '@supabase/supabase-js';

export type SetupState = 'no_env' | 'no_schema' | 'needs_update' | 'no_admin' | 'ready';

/** Works out how far the portal is set up, so the /setup page can tell a non-technical person the next step. */
export async function getSetupState(sb: SupabaseClient): Promise<SetupState> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return 'no_env';
  const chapters = await sb.from('chapters').select('id').limit(1);
  if (chapters.error) return 'no_schema';
  const settings = await sb.from('settings').select('key').limit(1);
  const place = await sb.from('households').select('place_area').limit(1);
  const has = await sb.rpc('has_admin');
  const repair = await sb.rpc('ensure_profile');
  if (settings.error || place.error || has.error || repair.error) return 'needs_update';
  return has.data ? 'ready' : 'no_admin';
}

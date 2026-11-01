import type { SupabaseClient } from '@supabase/supabase-js';

export type Settings = { upi_id: string; upi_name: string; help_phone: string };

/** Settings saved in the Admin console win; the environment variables are only a fallback. */
export async function getSettings(sb: SupabaseClient): Promise<Settings> {
  const { data } = await sb.from('settings').select('key,value');
  const m = new Map((data ?? []).map((r) => [r.key as string, (r.value as string) ?? '']));
  return {
    upi_id: m.get('upi_id') || process.env.NEXT_PUBLIC_UPI_ID || '',
    upi_name: m.get('upi_name') || process.env.NEXT_PUBLIC_UPI_NAME || 'Shri Dasha Vaishnav Porwad Samaj',
    help_phone: m.get('help_phone') || '',
  };
}

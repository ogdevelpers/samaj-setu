import type { SupabaseClient } from '@supabase/supabase-js';
import { currentFy } from './utils';

export async function householdDues(sb: SupabaseClient, householdId: string, waiver = 0) {
  const fy = currentFy();
  const [{ data: fee }, { count }, { data: pays }] = await Promise.all([
    sb.from('fee_years').select('per_member').eq('fy', fy).maybeSingle(),
    sb.from('people').select('id', { count: 'exact', head: true }).eq('household_id', householdId).eq('deceased', false),
    sb.from('payments').select('amount,status').eq('household_id', householdId).eq('fy', fy).eq('kind', 'dues'),
  ]);
  const perMember = Number(fee?.per_member ?? 0);
  const members = count ?? 0;
  const total = Math.max(perMember * members - Number(waiver ?? 0), 0);
  const paid = (pays ?? []).filter((p) => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0);
  const pending = (pays ?? []).filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  return { fy, perMember, members, total, paid, pending, balance: Math.max(total - paid, 0), feeSet: !!fee };
}

'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { currentFy, str, strOrNull } from '@/lib/utils';

export async function submitPayment(fd: FormData) {
  const c = await getCtx();
  const { sb, t } = c;
  if (!c.household) redirect('/register');
  const kind = ['dues', 'occasion', 'donation'].includes(str(fd.get('kind'))) ? str(fd.get('kind')) : 'dues';
  const amount = Number(str(fd.get('amount')));
  const back = (k: 'ok' | 'err', m: string) => redirect(`/payments?${k}=${encodeURIComponent(m)}${kind === 'dues' ? '' : '&tab=occasion'}`);
  if (!(amount > 0)) back('err', t('Enter the amount you paid.', 'भुगतान की गई राशि लिखें।'));
  const utr = strOrNull(fd.get('utr'));
  const shot = strOrNull(fd.get('screenshot'));
  if (!utr && !shot) back('err', t('Enter the UTR / transaction ID or attach a screenshot, so the treasurer can match it.', 'UTR / लेन-देन संख्या लिखें या स्क्रीनशॉट जोड़ें ताकि कोषाध्यक्ष मिलान कर सकें।'));
  const vis = ['amount', 'name', 'private'].includes(str(fd.get('visibility'))) ? str(fd.get('visibility')) : 'name';
  const { error } = await sb.from('payments').insert({
    household_id: c.household.id, fy: currentFy(), kind, amount, mode: 'upi', utr, screenshot_path: shot,
    occasion: kind === 'dues' ? null : strOrNull(fd.get('occasion')), fund: kind === 'dues' ? null : strOrNull(fd.get('fund')) ?? 'general',
    visibility: vis, label: strOrNull(fd.get('label')) ?? c.household.head_name, note: strOrNull(fd.get('note')), created_by: c.user.id,
  });
  if (error) back('err', error.message);
  revalidatePath('/payments');
  back('ok', t('Sent. The treasurer will confirm it and your receipt will appear below.', 'भेज दिया गया। कोषाध्यक्ष पुष्टि करेंगे और आपकी रसीद नीचे दिखेगी।'));
}

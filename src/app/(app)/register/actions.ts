'use server';
import { redirect } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { str, strOrNull } from '@/lib/utils';

export async function registerHousehold(fd: FormData) {
  const c = await getCtx();
  const { sb, user, t } = c;
  if (c.household) redirect('/family');
  const fail = (m: string) => redirect(`/register?err=${encodeURIComponent(m)}`);
  const name = str(fd.get('name'));
  const chapter = strOrNull(fd.get('chapter'));
  const area = strOrNull(fd.get('place_area'));
  if (!name) fail(t('Please write your name.', 'कृपया अपना नाम लिखें।'));
  if (!chapter && !area) fail(t('Please choose or write your place.', 'कृपया अपना स्थान चुनें या लिखें।'));

  // already registered (double tap, or an older half-finished attempt): link it and carry on
  const { data: existing } = await sb.from('households').select('id').eq('head_user_id', user.id).maybeSingle();
  if (existing) {
    await sb.rpc('link_my_household');
    redirect('/family');
  }
  await sb.rpc('ensure_profile');
  const { data: h, error } = await sb.from('households').insert({
    head_user_id: user.id, head_name: name, chapter_id: chapter,
    place_state: strOrNull(fd.get('place_state')), place_district: strOrNull(fd.get('place_district')), place_area: area,
  }).select('id').single();
  if (error || !h) fail(error?.message ?? 'Could not register');
  const hid = h!.id as string;
  const phone = strOrNull(fd.get('phone'));
  await sb.from('household_private').insert({ household_id: hid, address: strOrNull(fd.get('address')), phone });
  const { data: p } = await sb
    .from('people')
    .insert({
      household_id: hid, full_name: name, relation: 'self', is_head: true,
      gender: strOrNull(fd.get('gender')), dob: strOrNull(fd.get('dob')),
      occupation: strOrNull(fd.get('occupation')), blood_group: strOrNull(fd.get('blood')),
      can_donate_blood: fd.get('donor') === 'on',
    })
    .select('id')
    .single();
  if (p) await sb.from('person_contacts').insert({ person_id: p.id, phone, visible: fd.get('show_phone') === 'on' });
  await sb.from('profiles').update({ full_name: name }).eq('id', user.id);
  redirect(`/family?ok=${encodeURIComponent(t('Registered. Now add your family members, or do it later.', 'पंजीकरण हो गया। अब परिवार के सदस्य जोड़ें, या बाद में जोड़ें।'))}`);
}

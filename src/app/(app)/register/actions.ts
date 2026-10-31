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
  const chapter = str(fd.get('chapter'));
  if (!name || !chapter) fail(t('Please fill your name and choose your place.', 'कृपया अपना नाम भरें और स्थान चुनें।'));
  if (fd.get('consent') !== 'on') fail(t('Please tick the consent box.', 'कृपया सहमति का बॉक्स चुनें।'));

  const { data: h, error } = await sb.from('households').insert({ head_user_id: user.id, head_name: name, chapter_id: chapter }).select('id').single();
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
  redirect(`/family?ok=${encodeURIComponent(t('Sent to your local coordinator for approval. Add the other family members now.', 'स्थानीय संयोजक को स्वीकृति के लिए भेज दिया गया। अब परिवार के अन्य सदस्य जोड़ें।'))}`);
}

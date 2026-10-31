'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { str, strOrNull } from '@/lib/utils';

const go = (path: string, key: 'ok' | 'err', msg: string) => redirect(`${path}?${key}=${encodeURIComponent(msg)}`);

export async function addMember(fd: FormData) {
  const c = await getCtx();
  const { sb, t } = c;
  if (!c.household) redirect('/register');
  const hid = c.household.id as string;
  const name = str(fd.get('name'));
  if (!name) go('/family', 'err', t('Enter the person\'s name.', 'सदस्य का नाम लिखें।'));
  const relation = str(fd.get('relation')) || 'other';
  const gender = strOrNull(fd.get('gender')) ?? (['son', 'father'].includes(relation) ? 'M' : ['daughter', 'mother'].includes(relation) ? 'F' : null);

  const { data: members } = await sb.from('people').select('id,gender,is_head,spouse_id,father_id,mother_id').eq('household_id', hid);
  const head = (members ?? []).find((m) => m.is_head);
  const headSpouse = head?.spouse_id ? (members ?? []).find((m) => m.id === head.spouse_id) : undefined;

  const row: Record<string, unknown> = {
    household_id: hid, full_name: name, relation, gender,
    dob: strOrNull(fd.get('dob')), occupation: strOrNull(fd.get('occupation')), blood_group: strOrNull(fd.get('blood')),
    can_donate_blood: fd.get('donor') === 'on',
  };
  if (head && (relation === 'son' || relation === 'daughter')) {
    const headIsFather = head.gender !== 'F';
    row.father_id = headIsFather ? head.id : headSpouse?.id ?? null;
    row.mother_id = headIsFather ? headSpouse?.id ?? null : head.id;
  }
  if (head && relation === 'spouse') row.spouse_id = head.id;

  const { data: p, error } = await sb.from('people').insert(row).select('id').single();
  if (error || !p) go('/family', 'err', error?.message ?? 'Could not add');
  await sb.from('person_contacts').insert({ person_id: p!.id, phone: strOrNull(fd.get('phone')), visible: fd.get('show_phone') === 'on' });

  if (head) {
    if (relation === 'spouse') {
      await sb.from('people').update({ spouse_id: p!.id }).eq('id', head.id);
      // children added before the spouse get their missing parent filled in
      const fix = head.gender !== 'F' ? { mother_id: p!.id } : { father_id: p!.id };
      const col = head.gender !== 'F' ? 'mother_id' : 'father_id';
      const parent = head.gender !== 'F' ? 'father_id' : 'mother_id';
      await sb.from('people').update(fix).eq('household_id', hid).eq(parent, head.id).is(col, null);
    } else if (relation === 'father') {
      await sb.from('people').update({ father_id: p!.id }).eq('id', head.id);
    } else if (relation === 'mother') {
      await sb.from('people').update({ mother_id: p!.id }).eq('id', head.id);
    }
  }
  revalidatePath('/family');
  go('/family', 'ok', t('Member added.', 'सदस्य जोड़ दिया गया।'));
}

export async function updateMember(fd: FormData) {
  const c = await getCtx();
  const { sb, t } = c;
  const id = str(fd.get('id'));
  const link = (k: string) => strOrNull(fd.get(k));
  const { error } = await sb
    .from('people')
    .update({
      full_name: str(fd.get('name')), gender: link('gender'), dob: link('dob'), occupation: link('occupation'),
      blood_group: link('blood'), can_donate_blood: fd.get('donor') === 'on', deceased: fd.get('deceased') === 'on',
      relation: str(fd.get('relation')) || 'other',
      father_id: link('father_id'), mother_id: link('mother_id'), spouse_id: link('spouse_id'),
    })
    .eq('id', id);
  if (error) go(`/family/${id}`, 'err', error.message);
  await sb.from('person_contacts').upsert({ person_id: id, phone: link('phone'), visible: fd.get('show_phone') === 'on' });
  const spouse = link('spouse_id');
  if (spouse) await sb.from('people').update({ spouse_id: id }).eq('id', spouse); // works when the spouse is in this household
  revalidatePath('/family');
  go('/family', 'ok', t('Saved.', 'सहेजा गया।'));
}

export async function removeMember(fd: FormData) {
  const c = await getCtx();
  const id = str(fd.get('id'));
  const { error } = await c.sb.from('people').delete().eq('id', id).eq('is_head', false);
  if (error) go('/family', 'err', error.message);
  revalidatePath('/family');
  go('/family', 'ok', c.t('Member removed.', 'सदस्य हटा दिया गया।'));
}

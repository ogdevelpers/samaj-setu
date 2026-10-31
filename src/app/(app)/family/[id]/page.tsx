import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { updateMember } from '../actions';
import { Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { BLOOD } from '@/lib/utils';

export default async function EditMember({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; err?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const c = await getCtx();
  const { t, sb } = c;
  const { data: p } = await sb.from('people').select('*, person_contacts(phone,visible)').eq('id', id).maybeSingle();
  if (!p) notFound();
  const contact = Array.isArray(p.person_contacts) ? p.person_contacts[0] : p.person_contacts;
  const { data: mine } = await sb.from('people').select('id,full_name,gender').eq('household_id', p.household_id).neq('id', id);
  const q = (sp.q ?? '').trim();
  const { data: found } = q
    ? await sb.from('people').select('id,full_name,gender,dob,household:households(chapter:chapters(area))').ilike('full_name', `%${q}%`).neq('id', id).limit(15)
    : { data: [] };
  // keep the currently linked relatives selectable even if they live in another household
  const linkedIds = [p.father_id, p.mother_id, p.spouse_id].filter(Boolean);
  const { data: linked } = linkedIds.length ? await sb.from('people').select('id,full_name').in('id', linkedIds) : { data: [] };
  const opts = new Map<string, string>();
  (linked ?? []).forEach((x) => opts.set(x.id, x.full_name));
  (mine ?? []).forEach((x) => opts.set(x.id, x.full_name));
  (found ?? []).forEach((x: any) => opts.set(x.id, `${x.full_name}${x.dob ? ' · ' + x.dob.slice(0, 4) : ''}${x.household?.chapter?.area ? ' · ' + x.household.chapter.area : ''}`));
  const select = (name: string, cur: string | null) => (
    <select name={name} defaultValue={cur ?? ''} className="input">
      <option value="">—</option>
      {[...opts.entries()].map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );

  return (
    <>
      <PageHead kicker={t('Edit person', 'सदस्य बदलें')} title={p.full_name}>
        <Link href="/family" className="btn-alt btn btn-sm">← {t('Back', 'पीछे')}</Link>
      </PageHead>
      <Flash err={sp.err} />
      <form action={updateMember} className="card flex flex-col gap-3">
        <input type="hidden" name="id" value={p.id} />
        <div className="form-grid">
          <Field label={t('Full name', 'पूरा नाम')}><input name="name" required defaultValue={p.full_name} className="input" /></Field>
          <Field label={t('Relation to head', 'मुखिया से संबंध')}>
            <select name="relation" defaultValue={p.relation} className="input">
              {['self', 'spouse', 'son', 'daughter', 'father', 'mother', 'other'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label={t('Gender', 'लिंग')}>
            <select name="gender" defaultValue={p.gender ?? ''} className="input"><option value="">—</option><option value="M">{t('Male', 'पुरुष')}</option><option value="F">{t('Female', 'महिला')}</option></select>
          </Field>
          <Field label={t('Date of birth', 'जन्म तिथि')}><input name="dob" type="date" defaultValue={p.dob ?? ''} className="input" /></Field>
          <Field label={t('Occupation or school', 'व्यवसाय या विद्यालय')}><input name="occupation" defaultValue={p.occupation ?? ''} className="input" /></Field>
          <Field label={t('Blood group', 'रक्त समूह')}>
            <select name="blood" defaultValue={p.blood_group ?? ''} className="input"><option value="">—</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select>
          </Field>
          <Field label={t('Mobile', 'मोबाइल')}><input name="phone" defaultValue={contact?.phone ?? ''} inputMode="tel" className="input" /></Field>
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" name="show_phone" defaultChecked={!!contact?.visible} />{t('Show phone to verified members', 'फोन सत्यापित सदस्यों को दिखाएँ')}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="donor" defaultChecked={p.can_donate_blood} />{t('Can donate blood', 'रक्तदान कर सकते हैं')}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="deceased" defaultChecked={p.deceased} />{t('Passed away (stays on the tree, not counted in dues)', 'स्वर्गवासी (वृक्ष में रहेंगे, शुल्क में नहीं गिने जाएँगे)')}</label>
        <h2 className="mt-2">{t('Family links', 'पारिवारिक संबंध')}</h2>
        <div className="form-grid">
          <Field label={t('Father', 'पिता')}>{select('father_id', p.father_id)}</Field>
          <Field label={t('Mother', 'माता')}>{select('mother_id', p.mother_id)}</Field>
          <Field label={t('Spouse', 'जीवनसाथी')}>{select('spouse_id', p.spouse_id)}</Field>
        </div>
        <div><Submit className="btn-gold">{t('Save', 'सहेजें')}</Submit></div>
      </form>
      <form className="card flex flex-col gap-2" method="get">
        <h2>{t('Link to a relative in another household', 'दूसरे परिवार के रिश्तेदार से जोड़ें')}</h2>
        <p className="text-sm text-muted">{t('Search a verified member by name, then pick them in the lists above and save.', 'नाम से किसी सत्यापित सदस्य को खोजें, फिर ऊपर की सूचियों में उन्हें चुनकर सहेजें।')}</p>
        <div className="flex gap-2"><input name="q" defaultValue={q} className="input" placeholder={t('Name', 'नाम')} aria-label="Search" /><button className="btn-alt btn">{t('Search', 'खोजें')}</button></div>
        {q && <p className="text-sm text-muted">{(found ?? []).length} {t('found. They now appear in the Father, Mother and Spouse lists above.', 'मिले। वे अब ऊपर पिता, माता और जीवनसाथी की सूचियों में दिखेंगे।')}</p>}
      </form>
    </>
  );
}

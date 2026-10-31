import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { addMember, removeMember } from './actions';
import { Avatar, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { BLOOD, fmtDate, inr } from '@/lib/utils';
import { householdDues } from '@/lib/dues';

export default async function FamilyPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await getCtx();
  const { t, lang, sb } = c;
  if (!c.household) redirect('/register');
  const hid = c.household.id as string;
  const [{ data: people }, { data: priv }] = await Promise.all([
    sb.from('people').select('*, person_contacts(phone,visible)').eq('household_id', hid).order('created_at'),
    sb.from('household_private').select('address,phone').eq('household_id', hid).maybeSingle(),
  ]);
  const dues = await householdDues(sb, hid, c.household.waiver_amount);
  const status = c.household.status as string;
  const rel: Record<string, string> = {
    self: t('Head', 'मुखिया'), spouse: t('Spouse', 'जीवनसाथी'), son: t('Son', 'पुत्र'), daughter: t('Daughter', 'पुत्री'),
    father: t('Father', 'पिता'), mother: t('Mother', 'माता'), other: t('Other', 'अन्य'),
  };

  return (
    <>
      <PageHead kicker={c.household.chapter?.name} title={t('My family', 'मेरा परिवार')} sub={t('Everyone in your household. The tree is built from the parent and spouse links here.', 'आपके परिवार के सभी सदस्य। वंश वृक्ष यहीं के माता-पिता और जीवनसाथी के संबंधों से बनता है।')} />
      <Flash ok={sp.ok} err={sp.err} />
      {status === 'pending' && (
        <div className="card-flat border-warn bg-warn-soft text-warn">
          <b>{t('Waiting for approval.', 'स्वीकृति की प्रतीक्षा है।')}</b>{' '}
          {t('Your local coordinator will verify your household. You can keep adding members meanwhile.', 'आपके स्थानीय संयोजक परिवार का सत्यापन करेंगे। तब तक आप सदस्य जोड़ते रहें।')}
        </div>
      )}
      {status === 'rejected' && (
        <div className="card-flat border-bad bg-bad-soft text-bad">
          <b>{t('Registration returned.', 'पंजीकरण लौटाया गया।')}</b> {c.household.reject_note}
        </div>
      )}
      {status === 'approved' && (
        <div className="card-flat flex flex-wrap items-center justify-between gap-3">
          <span>{t('Annual dues', 'वार्षिक शुल्क')} {dues.fy}: <b className="tabular-nums">{inr(dues.members * dues.perMember)}</b> ({dues.members} × {inr(dues.perMember)}) · {t('Balance', 'शेष')} <b className="tabular-nums">{inr(dues.balance)}</b></span>
          <Link href="/payments" className="btn btn-sm">{t('Payments', 'भुगतान')}</Link>
        </div>
      )}

      <section className="card flex flex-col gap-3">
        <h2>{t('People in this household', 'इस परिवार के सदस्य')} ({(people ?? []).length})</h2>
        <div className="divide-y divide-line">
          {(people ?? []).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
              <Avatar name={p.full_name} female={p.gender === 'F'} />
              <div className="min-w-0 flex-1">
                <b>{p.full_name}</b> {p.deceased && <span className="pill-bad">{t('Late', 'स्वर्गीय')}</span>}
                <p className="text-sm text-muted">
                  {rel[p.relation] ?? p.relation}{p.dob ? ` · ${fmtDate(p.dob, lang)}` : ''}{p.occupation ? ` · ${p.occupation}` : ''}{p.blood_group ? ` · ${p.blood_group}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/family/${p.id}`} className="btn-alt btn btn-sm">{t('Edit', 'बदलें')}</Link>
                {!p.is_head && (
                  <form action={removeMember}>
                    <input type="hidden" name="id" value={p.id} />
                    <Submit className="btn-bad btn btn-sm">{t('Remove', 'हटाएँ')}</Submit>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
        {priv?.address && <p className="text-sm text-muted">{t('Address on file', 'दर्ज पता')}: {priv.address}</p>}
      </section>

      <form action={addMember} className="card flex flex-col gap-3">
        <h2>{t('Add a person', 'सदस्य जोड़ें')}</h2>
        <div className="form-grid">
          <Field label={t('Full name', 'पूरा नाम')}><input name="name" required className="input" /></Field>
          <Field label={t('Relation to head', 'मुखिया से संबंध')}>
            <select name="relation" className="input" defaultValue="son">
              {['spouse', 'son', 'daughter', 'father', 'mother', 'other'].map((r) => <option key={r} value={r}>{rel[r]}</option>)}
            </select>
          </Field>
          <Field label={t('Gender', 'लिंग')}>
            <select name="gender" className="input" defaultValue="">
              <option value="">{t('Auto from relation', 'संबंध से स्वतः')}</option>
              <option value="M">{t('Male', 'पुरुष')}</option><option value="F">{t('Female', 'महिला')}</option>
            </select>
          </Field>
          <Field label={t('Date of birth', 'जन्म तिथि')}><input name="dob" type="date" className="input" /></Field>
          <Field label={t('Occupation or school', 'व्यवसाय या विद्यालय')}><input name="occupation" className="input" /></Field>
          <Field label={t('Blood group', 'रक्त समूह')}>
            <select name="blood" className="input" defaultValue=""><option value="">—</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select>
          </Field>
          <Field label={t('Mobile (optional)', 'मोबाइल (वैकल्पिक)')}><input name="phone" inputMode="tel" className="input" /></Field>
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" name="show_phone" />{t('Show this phone to verified members', 'यह फोन सत्यापित सदस्यों को दिखाएँ')}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="donor" />{t('Can donate blood', 'रक्तदान कर सकते हैं')}</label>
        <div><Submit className="btn-gold">{t('Add person', 'सदस्य जोड़ें')}</Submit></div>
        <p className="text-sm text-muted">{t('Children and elders without a phone are managed by you. A daughter who marries stays linked to this tree.', 'फोन न रखने वाले बच्चों और बुजुर्गों को आप ही संभालते हैं। विवाह के बाद भी पुत्री इस वंश वृक्ष से जुड़ी रहती है।')}</p>
      </form>
    </>
  );
}

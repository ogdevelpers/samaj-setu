import { redirect } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { registerHousehold } from './actions';
import { Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { PlacePicker } from '@/components/place-picker';
import { BLOOD } from '@/lib/utils';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const c = await getCtx();
  const { t } = c;
  if (c.household) redirect('/family');
  const { data: chapters } = await c.sb.from('chapters').select('id,name,state,district,area').order('state').order('district').order('area');

  return (
    <>
      <PageHead
        kicker={t('Step 1 of 2', 'चरण 1 / 2')}
        title={t('Tell us about your family', 'अपने परिवार के बारे में बताएँ')}
        sub={t('Only your name and place are needed. Everything else is optional and can be added later.', 'केवल आपका नाम और स्थान चाहिए। बाकी सब वैकल्पिक है और बाद में जोड़ सकते हैं।')}
      />
      <Flash err={sp.err} />
      <form action={registerHousehold} className="card flex flex-col gap-4">
        <div className="form-grid">
          <Field label={t('Head of family (full name)', 'परिवार के मुखिया (पूरा नाम)')}>
            <input name="name" required defaultValue={c.profile?.full_name ?? ''} className="input" autoComplete="name" />
          </Field>
          <Field label={t('Mobile number', 'मोबाइल नंबर')}><input name="phone" inputMode="tel" autoComplete="tel" className="input" /></Field>
          <PlacePicker
            chapters={chapters ?? []}
            labels={{
              state: t('State', 'राज्य'), district: t('District / city', 'जिला / शहर'), area: t('Village / area', 'गाँव / क्षेत्र'), choose: t('Choose…', 'चुनें…'),
              notListed: t('My place is not in the list', 'मेरा स्थान सूची में नहीं है'), backToList: t('Choose from the list instead', 'सूची से चुनें'),
              typeHelp: t('Just write it. The committee will connect you to the right place when approving.', 'बस लिख दें। स्वीकृति के समय समिति आपको सही स्थान से जोड़ देगी।'),
            }}
          />
        </div>
        <details className="rounded-xl border border-line p-3">
          <summary className="cursor-pointer font-semibold text-brand">{t('More details (optional)', 'और जानकारी (वैकल्पिक)')}</summary>
          <div className="form-grid mt-3">
            <Field label={t('Gender', 'लिंग')}><select name="gender" className="input" defaultValue="M"><option value="M">{t('Male', 'पुरुष')}</option><option value="F">{t('Female', 'महिला')}</option></select></Field>
            <Field label={t('Date of birth', 'जन्म तिथि')}><input name="dob" type="date" className="input" /></Field>
            <Field label={t('Occupation', 'व्यवसाय')}><input name="occupation" className="input" /></Field>
            <Field label={t('Blood group', 'रक्त समूह')}><select name="blood" className="input" defaultValue=""><option value="">—</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field label={t('Home address (only you and the committee can see this)', 'घर का पता (केवल आप और समिति देख सकेंगे)')}><textarea name="address" rows={2} className="input" /></Field></div>
          </div>
          <label className="mt-3 flex items-start gap-2"><input type="checkbox" name="show_phone" className="mt-1" /><span>{t('Show my phone number to verified members', 'मेरा फोन नंबर सत्यापित सदस्यों को दिखाएँ')}</span></label>
          <label className="mt-2 flex items-start gap-2"><input type="checkbox" name="donor" className="mt-1" /><span>{t('I can donate blood in an emergency', 'मैं आपात स्थिति में रक्तदान कर सकता/सकती हूँ')}</span></label>
        </details>
        <div className="flex flex-wrap items-center gap-3"><Submit className="btn-gold">{t('Register and continue', 'पंजीकरण करें और आगे बढ़ें')}</Submit>
          <span className="text-sm text-muted">{t('Next: add family members (optional).', 'आगे: परिवार के सदस्य जोड़ें (वैकल्पिक)।')}</span></div>
      </form>
    </>
  );
}

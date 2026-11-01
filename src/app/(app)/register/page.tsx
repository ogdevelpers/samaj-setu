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
  const { data: chapters, error: chaptersError } = await c.sb.from('chapters').select('id,name,state,district,area').order('state').order('district').order('area');

  return (
    <>
      <PageHead
        kicker={t('New household', 'नया परिवार')}
        title={t('Register your family', 'अपने परिवार का पंजीकरण करें')}
        sub={t('One person registers the household, then adds everyone in it. Your local coordinator checks it before it goes live.', 'एक व्यक्ति परिवार का पंजीकरण करता है और फिर सभी सदस्यों को जोड़ता है। लागू होने से पहले स्थानीय संयोजक इसकी जाँच करते हैं।')}
      />
      <Flash err={sp.err} />
      {(chapters ?? []).length === 0 ? (
        <div className="card-flat">
          {t('No places have been set up yet. Ask the committee to add your chapter.', 'अभी कोई स्थान जोड़ा नहीं गया है। समिति से अपनी शाखा जोड़ने को कहें।')}
          {chaptersError && <p className="mt-2 break-words text-sm text-bad">Database says: {chaptersError.message}</p>}
        </div>
      ) : (
        <form action={registerHousehold} className="card flex flex-col gap-4">
          <div className="form-grid">
            <Field label={t('Head of family (full name)', 'परिवार के मुखिया (पूरा नाम)')}>
              <input name="name" required defaultValue={c.profile?.full_name ?? ''} className="input" />
            </Field>
            <Field label={t('Mobile number', 'मोबाइल नंबर')}>
              <input name="phone" inputMode="tel" className="input" />
            </Field>
            <PlacePicker chapters={chapters ?? []} labels={{ state: t('State', 'राज्य'), district: t('District', 'जिला'), area: t('Village / area', 'गाँव / क्षेत्र'), choose: t('Choose…', 'चुनें…') }} />
            <Field label={t('Gender', 'लिंग')}>
              <select name="gender" className="input" defaultValue="M">
                <option value="M">{t('Male', 'पुरुष')}</option>
                <option value="F">{t('Female', 'महिला')}</option>
              </select>
            </Field>
            <Field label={t('Date of birth', 'जन्म तिथि')}><input name="dob" type="date" className="input" /></Field>
            <Field label={t('Occupation', 'व्यवसाय')}><input name="occupation" className="input" /></Field>
            <Field label={t('Blood group', 'रक्त समूह')}>
              <select name="blood" className="input" defaultValue="">
                <option value="">—</option>
                {BLOOD.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label={t('Home address (only you and your coordinator can see this)', 'घर का पता (केवल आप और आपके संयोजक देख सकेंगे)')}>
                <textarea name="address" rows={2} className="input" />
              </Field>
            </div>
          </div>
          <label className="flex items-start gap-2"><input type="checkbox" name="show_phone" className="mt-1" />
            <span>{t('Show my phone number to verified members', 'मेरा फोन नंबर सत्यापित सदस्यों को दिखाएँ')}</span></label>
          <label className="flex items-start gap-2"><input type="checkbox" name="donor" className="mt-1" />
            <span>{t('I can donate blood in an emergency', 'मैं आपात स्थिति में रक्तदान कर सकता/सकती हूँ')}</span></label>
          <label className="flex items-start gap-2"><input type="checkbox" name="consent" required className="mt-1" />
            <span>{t('I agree that the samaj may store this information and show it only to verified members.', 'मैं सहमत हूँ कि समाज यह जानकारी रखे और केवल सत्यापित सदस्यों को दिखाए।')}</span></label>
          <div><Submit className="btn-gold">{t('Register and continue', 'पंजीकरण करें और आगे बढ़ें')}</Submit></div>
        </form>
      )}
    </>
  );
}

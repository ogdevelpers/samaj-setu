import { requireStaff } from '@/lib/ctx';
import { saveSettings } from '../actions';
import { Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { getSettings } from '@/lib/settings';
import { currentFy } from '@/lib/utils';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff(['admin']);
  const { t, sb } = c;
  const fy = currentFy();
  const [cfg, { data: fee }] = await Promise.all([getSettings(sb), sb.from('fee_years').select('per_member').eq('fy', fy).maybeSingle()]);
  return (
    <>
      <PageHead kicker={t('Money and contact', 'धन और संपर्क')} title={t('Settings', 'सेटिंग')} />
      <Flash ok={sp.ok} err={sp.err} />
      <form action={saveSettings} className="card flex max-w-2xl flex-col gap-4">
        <div className="form-grid">
          <Field label={`${t('Yearly fee per member', 'प्रति सदस्य वार्षिक शुल्क')} (₹, ${fy})`}><input name="per_member" type="number" min="0" defaultValue={fee?.per_member ?? 1000} className="input" /></Field>
          <div />
          <Field label={t('Trust UPI ID', 'ट्रस्ट का UPI ID')}><input name="upi_id" defaultValue={cfg.upi_id} className="input" placeholder="yourtrust@bank" /></Field>
          <Field label={t('Name shown in the UPI app', 'UPI ऐप में दिखने वाला नाम')}><input name="upi_name" defaultValue={cfg.upi_name} className="input" /></Field>
          <Field label={t('Help phone number (optional)', 'सहायता फोन नंबर (वैकल्पिक)')}><input name="help_phone" defaultValue={cfg.help_phone} className="input" /></Field>
        </div>
        <p className="text-sm text-muted">{t('Use the UPI ID of the trust\'s own bank account, never a person\'s. Families scan a QR for it.', 'ट्रस्ट के अपने बैंक खाते का UPI ID लगाएँ, किसी व्यक्ति का नहीं। परिवार इसका QR स्कैन करेंगे।')}</p>
        <div><Submit className="btn-gold">{t('Save settings', 'सेटिंग सहेजें')}</Submit></div>
      </form>
    </>
  );
}

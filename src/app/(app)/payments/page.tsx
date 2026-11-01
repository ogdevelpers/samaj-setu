import Link from 'next/link';
import QRCode from 'qrcode';
import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/ctx';
import { submitPayment } from './actions';
import { Empty, Flash, PageHead } from '@/components/ui';
import { PayForms } from '@/components/pay-forms';
import { CopyButton } from '@/components/copy-button';
import { Icon } from '@/components/icon';
import { householdDues } from '@/lib/dues';
import { getSettings } from '@/lib/settings';
import { FUNDS, OCCASIONS, fmtDate, inr } from '@/lib/utils';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; tab?: string }> }) {
  const sp = await searchParams;
  const c = await requireMember();
  const { t, lang, sb } = c;
  if (!c.household) redirect('/admin');
  const hid = c.household.id as string;
  const [dues, { data: history }, cfg] = await Promise.all([
    householdDues(sb, hid, c.household.waiver_amount),
    sb.from('payments').select('*').eq('household_id', hid).order('created_at', { ascending: false }),
    getSettings(sb),
  ]);
  const ref = 'FAM-' + hid.slice(0, 6).toUpperCase();
  let qr = '';
  let upiLink = '';
  if (cfg.upi_id) {
    upiLink = `upi://pay?pa=${encodeURIComponent(cfg.upi_id)}&pn=${encodeURIComponent(cfg.upi_name)}&cu=INR&tn=${encodeURIComponent(ref)}${dues.balance > 0 ? `&am=${dues.balance}` : ''}`;
    qr = await QRCode.toString(upiLink, { type: 'svg', margin: 1, width: 180 });
  }
  const statusPill = (s: string) => (s === 'confirmed' ? <span className="pill-good">{t('Confirmed', 'पुष्ट')}</span> : s === 'pending' ? <span className="pill-warn">{t('Waiting', 'प्रतीक्षा में')}</span> : <span className="pill-bad">{t('Returned', 'लौटाया')}</span>);
  const kindLabel = (p: any) => (p.kind === 'dues' ? `${t('Annual dues', 'वार्षिक शुल्क')} ${p.fy}` : p.kind === 'occasion' ? `${t('Occasion', 'अवसर')} · ${p.occasion ?? ''}` : t('Donation', 'दान'));
  const L = {
    tabDues: t('Annual dues', 'वार्षिक शुल्क'), tabOccasion: t('Occasion / donation', 'अवसर / दान'),
    duesHelp: t('Pay by UPI first, then tell us here so the treasurer can match it. You may pay in parts.', 'पहले UPI से भुगतान करें, फिर यहाँ बताएँ ताकि कोषाध्यक्ष मिलान कर सकें। आप हिस्सों में भी दे सकते हैं।'),
    occHelp: t('For a marriage, a birth, moksh or any family occasion. The amount is entirely your choice.', 'विवाह, जन्म, मोक्ष या किसी भी पारिवारिक अवसर के लिए। राशि पूरी तरह आपकी इच्छा है।'),
    full: t('Full balance', 'पूरा शेष'), amount: t('Amount paid (₹)', 'जमा राशि (₹)'), utr: t('UTR / transaction ID', 'UTR / लेन-देन संख्या'), utrHint: t('12 digits in your UPI app', 'UPI ऐप में 12 अंक'),
    shot: t('Screenshot (optional)', 'स्क्रीनशॉट (वैकल्पिक)'), attached: t('Attached ✓', 'जुड़ गया ✓'), send: t('Send to treasurer', 'कोषाध्यक्ष को भेजें'),
    donation: t('Donation', 'दान'), fund: t('Goes to', 'किस कोष में'), familyName: t('In the name of', 'किसके नाम से'),
    whoSees: t('Who can see this on the Shubh samachar board? Your choice.', 'शुभ समाचार पट पर इसे कौन देख सके? आपकी पसंद।'),
    visAmount: t('Name and amount', 'नाम और राशि'), visName: t('Name only', 'केवल नाम'), visPrivate: t('Private (treasurer only)', 'गोपनीय (केवल कोषाध्यक्ष)'),
  };

  return (
    <>
      <PageHead kicker={`${t('FY', 'वित्त वर्ष')} ${dues.fy} · ${t('April to March', 'अप्रैल से मार्च')}`} title={t('Payments', 'भुगतान')} />
      <Flash ok={sp.ok} err={sp.err} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2>{c.household.head_name}</h2>
            {dues.balance > 0 ? <span className="pill-warn">{inr(dues.balance)} {t('due', 'देय')}</span> : <span className="pill-good">{t('Paid', 'जमा')}</span>}
          </div>
          {!dues.feeSet ? <p className="text-muted">{t('The yearly fee has not been set yet. The admin will set it soon.', 'वार्षिक शुल्क अभी तय नहीं हुआ है। प्रबंधक शीघ्र तय करेंगे।')}</p> : (
            <>
              <div className="bar !h-3"><i style={{ width: `${dues.total ? Math.min(100, (dues.paid / dues.total) * 100) : 100}%` }} /></div>
              <table className="w-full"><tbody className="[&_td]:py-1.5">
                <tr><td>{t('Annual dues', 'वार्षिक शुल्क')} <span className="text-muted">({dues.members} × {inr(dues.perMember)})</span></td><td className="text-right tabular-nums">{inr(dues.members * dues.perMember)}</td></tr>
                {Number(c.household.waiver_amount) > 0 && <tr><td>{t('Waiver', 'छूट')}</td><td className="text-right tabular-nums">− {inr(c.household.waiver_amount)}</td></tr>}
                <tr><td>{t('Paid so far', 'अब तक जमा')}{dues.pending > 0 && <span className="text-muted"> (+ {inr(dues.pending)} {t('waiting', 'प्रतीक्षा में')})</span>}</td><td className="text-right tabular-nums">{inr(dues.paid)}</td></tr>
                <tr className="border-t border-line font-bold"><td>{t('Balance', 'शेष')}</td><td className="text-right tabular-nums">{inr(dues.balance)}</td></tr>
              </tbody></table>
            </>
          )}
          <p className="text-sm text-muted">{t('Need a waiver? Ask your chapter coordinator.', 'छूट चाहिए? अपने शाखा संयोजक से कहें।')}</p>
        </section>

        <section className="card flex flex-col gap-3">
          <h2>{t('Step 1: Pay by UPI', 'चरण 1: UPI से भुगतान करें')}</h2>
          {cfg.upi_id ? (
            <div className="flex flex-wrap items-start gap-4">
              <div className="w-[170px] overflow-hidden rounded-xl border border-line2 bg-white p-1" dangerouslySetInnerHTML={{ __html: qr }} />
              <div className="flex min-w-[170px] flex-1 flex-col gap-2">
                <div><span className="lbl">UPI ID</span><p className="break-all font-bold">{cfg.upi_id}</p></div>
                <div><span className="lbl">{t('Write this in the note', 'नोट में यह लिखें')}</span><p className="font-bold">{ref}</p></div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={cfg.upi_id} label={t('Copy UPI ID', 'UPI ID कॉपी करें')} doneLabel={t('Copied', 'कॉपी हुआ')} />
                  <a href={upiLink} className="btn btn-sm md:hidden"><Icon name="phone" className="h-4 w-4" />{t('Open UPI app', 'UPI ऐप खोलें')}</a>
                </div>
              </div>
            </div>
          ) : <p className="text-muted">{t('The trust UPI ID is not set yet. The admin can add it in Settings.', 'ट्रस्ट का UPI ID अभी सेट नहीं है। प्रबंधक इसे सेटिंग में जोड़ सकते हैं।')}</p>}
          <h2 className="mt-1">{t('Step 2: Tell us below', 'चरण 2: नीचे बताएँ')}</h2>
        </section>
      </div>

      <PayForms action={submitPayment} userId={c.user.id} balance={dues.balance} headName={c.household.head_name}
        occasions={OCCASIONS.map((o) => ({ key: o.key, label: lang === 'hi' ? o.hi : o.en, amount: o.amount }))}
        funds={FUNDS.map((f) => ({ key: f.key, label: lang === 'hi' ? f.hi : f.en }))} L={L} initialTab={sp.tab === 'occasion' ? 'occasion' : 'dues'} />

      <section className="card flex flex-col gap-3">
        <h2>{t('Your payment history', 'आपके भुगतान का विवरण')}</h2>
        {(history ?? []).length === 0 ? <Empty>{t('No payments yet.', 'अभी कोई भुगतान नहीं।')}</Empty> : (
          <div className="flex flex-col divide-y divide-line">
            {(history ?? []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1"><b>{kindLabel(p)}</b><p className="text-sm text-muted">{fmtDate(p.created_at, lang)}{p.note && p.status === 'rejected' ? ` · ${p.note}` : ''}</p></div>
                {statusPill(p.status)}
                <b className="w-24 text-right tabular-nums">{inr(p.amount)}</b>
                {p.status === 'confirmed' ? <Link href={`/payments/${p.id}/receipt`} className="btn-alt btn btn-sm">{t('Receipt', 'रसीद')} {p.receipt_no}</Link> : <span className="w-[110px]" />}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

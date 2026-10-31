import Link from 'next/link';
import QRCode from 'qrcode';
import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/ctx';
import { submitPayment } from './actions';
import { Empty, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { ShotInput } from '@/components/shot-input';
import { householdDues } from '@/lib/dues';
import { FUNDS, OCCASIONS, fmtDate, inr } from '@/lib/utils';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; occasion?: string; amount?: string }> }) {
  const sp = await searchParams;
  const c = await requireMember();
  const { t, lang, sb } = c;
  if (!c.household) redirect('/finance');
  const hid = c.household.id as string;
  const dues = await householdDues(sb, hid, c.household.waiver_amount);
  const { data: history } = await sb.from('payments').select('*').eq('household_id', hid).order('created_at', { ascending: false });
  const upi = process.env.NEXT_PUBLIC_UPI_ID ?? '';
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME ?? 'Samaj';
  const ref = 'FAM-' + hid.slice(0, 6).toUpperCase();
  let qr = '';
  if (upi) {
    const link = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(upiName)}&cu=INR&tn=${encodeURIComponent(ref)}${dues.balance > 0 ? `&am=${dues.balance}` : ''}`;
    qr = await QRCode.toString(link, { type: 'svg', margin: 1, width: 180 });
  }
  const occ = OCCASIONS.find((o) => o.key === sp.occasion) ?? OCCASIONS[0];
  const occAmount = sp.amount && Number(sp.amount) > 0 ? sp.amount : String(occ.amount);
  const statusPill = (s: string) => (s === 'confirmed' ? <span className="pill-good">{t('Confirmed', 'पुष्ट')}</span> : s === 'pending' ? <span className="pill-warn">{t('Waiting', 'प्रतीक्षा में')}</span> : <span className="pill-bad">{t('Returned', 'लौटाया')}</span>);
  const kindLabel = (p: any) => (p.kind === 'dues' ? `${t('Annual dues', 'वार्षिक शुल्क')} ${p.fy}` : p.kind === 'occasion' ? `${t('Occasion', 'अवसर')} · ${p.occasion ?? ''}` : t('Donation', 'दान'));

  return (
    <>
      <PageHead kicker={`${t('FY', 'वित्त वर्ष')} ${dues.fy} · ${t('April to March', 'अप्रैल से मार्च')}`} title={t('Payments', 'भुगतान')} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2>{c.household.head_name}</h2>
            {dues.balance > 0 ? <span className="pill-warn">{inr(dues.balance)} {t('due', 'देय')}</span> : <span className="pill-good">{t('Paid', 'जमा')}</span>}</div>
          {!dues.feeSet ? <p className="text-muted">{t('The yearly fee has not been set yet. The admin will set it soon.', 'वार्षिक शुल्क अभी तय नहीं हुआ है। प्रबंधक शीघ्र तय करेंगे।')}</p> : (
            <div className="overflow-x-auto"><table className="tbl !min-w-0"><tbody>
              <tr><td>{t('Annual dues', 'वार्षिक शुल्क')}</td><td className="tabular-nums text-muted">{dues.members} × {inr(dues.perMember)}</td><td className="text-right tabular-nums">{inr(dues.members * dues.perMember)}</td></tr>
              <tr><td>{t('Waiver', 'छूट')}</td><td /><td className="text-right tabular-nums">− {inr(c.household.waiver_amount)}</td></tr>
              <tr><td>{t('Paid so far', 'अब तक भुगतान')}</td><td className="text-muted">{dues.pending > 0 ? `+ ${inr(dues.pending)} ${t('waiting', 'प्रतीक्षा में')}` : ''}</td><td className="text-right tabular-nums">{inr(dues.paid)}</td></tr>
              <tr><td><b>{t('Balance', 'शेष')}</b></td><td /><td className="text-right tabular-nums"><b>{inr(dues.balance)}</b></td></tr>
            </tbody></table></div>
          )}
          <p className="text-sm text-muted">{t('You may pay in instalments: enter any amount below. For a waiver, ask your chapter coordinator.', 'आप किश्तों में भुगतान कर सकते हैं: नीचे कोई भी राशि लिखें। छूट के लिए अपने शाखा संयोजक से कहें।')}</p>
        </section>

        <section className="card flex flex-col gap-3">
          <h2>{t('Pay by UPI to the trust account', 'ट्रस्ट खाते में UPI से भुगतान')}</h2>
          {upi ? (
            <div className="flex flex-wrap items-start gap-4">
              <div className="w-[180px] overflow-hidden rounded-lg border border-line2 bg-white p-1" dangerouslySetInnerHTML={{ __html: qr }} />
              <div className="flex min-w-[180px] flex-1 flex-col gap-2">
                <div><span className="lbl">UPI ID</span><p className="break-all font-bold">{upi}</p></div>
                <div><span className="lbl">{t('Write this as the note', 'नोट में यह लिखें')}</span><p className="font-bold">{ref}</p></div>
                <p className="text-sm text-muted">{t('Pay in any UPI app, then fill the form below. No gateway fee.', 'किसी भी UPI ऐप से भुगतान करें, फिर नीचे फ़ॉर्म भरें। कोई गेटवे शुल्क नहीं।')}</p>
              </div>
            </div>
          ) : <p className="text-muted">{t('The trust UPI ID is not set yet.', 'ट्रस्ट का UPI ID अभी सेट नहीं है।')}</p>}
        </section>
      </div>

      <form action={submitPayment} className="card flex flex-col gap-3">
        <input type="hidden" name="kind" value="dues" />
        <h2>{t('I have paid my dues', 'मैंने शुल्क जमा कर दिया')}</h2>
        <div className="form-grid">
          <Field label={t('Amount paid (₹)', 'जमा राशि (₹)')}><input name="amount" type="number" min="1" defaultValue={dues.balance || ''} required className="input" /></Field>
          <Field label={t('UTR / transaction ID', 'UTR / लेन-देन संख्या')}><input name="utr" className="input" placeholder={t('12 digits from your UPI app', 'आपके UPI ऐप से 12 अंक')} /></Field>
          <ShotInput userId={c.user.id} label={t('Screenshot (optional)', 'स्क्रीनशॉट (वैकल्पिक)')} okLabel={t('Attached ✓', 'जुड़ गया ✓')} />
        </div>
        <div><Submit className="btn-gold">{t('Send to treasurer', 'कोषाध्यक्ष को भेजें')}</Submit></div>
      </form>

      <form id="occasion" action={submitPayment} className="card flex flex-col gap-3">
        <input type="hidden" name="kind" value="occasion" />
        <div><span className="lbl">{t('Voluntary · any amount', 'स्वैच्छिक · कोई भी राशि')}</span><h2>{t('Contribute on an occasion', 'अवसर पर सहयोग')}</h2>
          <p className="text-sm text-muted">{t('For a marriage, a birth, moksh or any family occasion. The amount is entirely your choice.', 'विवाह, जन्म, मोक्ष या किसी भी पारिवारिक अवसर के लिए। राशि पूरी तरह आपकी इच्छा है।')}</p></div>
        <div className="flex flex-wrap gap-1.5">
          {OCCASIONS.map((o) => <Link key={o.key} scroll={false} href={`/payments?occasion=${encodeURIComponent(o.key)}#occasion`} className="chip" aria-pressed={occ.key === o.key}>{lang === 'hi' ? o.hi : o.en}</Link>)}
          <Link scroll={false} href="/payments?occasion=Donation#occasion" className="chip" aria-pressed={sp.occasion === 'Donation'}>{t('Donation', 'दान')}</Link>
        </div>
        <input type="hidden" name="occasion" value={sp.occasion === 'Donation' ? '' : occ.key} />
        <div className="form-grid">
          <Field label={t('Amount (₹)', 'राशि (₹)')}><input name="amount" type="number" min="1" defaultValue={occAmount} required className="input" /></Field>
          <Field label={t('Goes to', 'किस कोष में')}>
            <select name="fund" className="input" defaultValue="general">{FUNDS.map((f) => <option key={f.key} value={f.key}>{lang === 'hi' ? f.hi : f.en}</option>)}</select>
          </Field>
          <Field label={t('In the name of the family', 'परिवार के नाम से')}><input name="label" defaultValue={c.household.head_name} className="input" /></Field>
          <Field label={t('UTR / transaction ID', 'UTR / लेन-देन संख्या')}><input name="utr" className="input" /></Field>
          <ShotInput userId={c.user.id} label={t('Screenshot (optional)', 'स्क्रीनशॉट (वैकल्पिक)')} okLabel={t('Attached ✓', 'जुड़ गया ✓')} />
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="flabel mb-1 text-[0.8rem] font-semibold text-muted">{t('Who can see this on the Shubh samachar board? Your choice.', 'शुभ समाचार पट पर इसे कौन देख सके? आपकी पसंद।')}</legend>
          <label className="flex items-center gap-2"><input type="radio" name="visibility" value="amount" />{t('Name and amount', 'नाम और राशि')}</label>
          <label className="flex items-center gap-2"><input type="radio" name="visibility" value="name" defaultChecked />{t('Name only', 'केवल नाम')}</label>
          <label className="flex items-center gap-2"><input type="radio" name="visibility" value="private" />{t('Private (treasurer only)', 'गोपनीय (केवल कोषाध्यक्ष)')}</label>
        </fieldset>
        <div><Submit className="btn-gold">{t('Send to treasurer', 'कोषाध्यक्ष को भेजें')}</Submit></div>
      </form>

      <section className="card flex flex-col gap-3">
        <h2>{t('Your payment history', 'आपके भुगतान का विवरण')}</h2>
        {(history ?? []).length === 0 ? <Empty>{t('No payments yet.', 'अभी कोई भुगतान नहीं।')}</Empty> : (
          <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('Date', 'दिनांक')}</th><th>{t('For', 'किसलिए')}</th><th>{t('Status', 'स्थिति')}</th><th className="text-right">{t('Amount', 'राशि')}</th><th /></tr></thead><tbody>
            {(history ?? []).map((p) => (
              <tr key={p.id}>
                <td>{fmtDate(p.created_at, lang)}</td><td>{kindLabel(p)}</td><td>{statusPill(p.status)}</td>
                <td className="text-right tabular-nums">{inr(p.amount)}</td>
                <td className="text-right">{p.status === 'confirmed' && <Link href={`/payments/${p.id}/receipt`} className="font-semibold text-brand underline">{p.receipt_no}</Link>}</td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </section>
    </>
  );
}

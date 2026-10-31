import { requireRole } from '@/lib/ctx';
import { addExpense, confirmPayment, deleteExpense, recordPayment, rejectPayment, setFee } from './actions';
import { Empty, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { OCCASIONS, currentFy, fmtDate, inr } from '@/lib/utils';

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireRole((x) => x.isAdmin || x.isTreasurer);
  const { t, lang, sb } = c;
  const fy = currentFy();
  const y = Number(fy.slice(0, 4));
  const [{ data: summaryRows }, { data: pending }, { data: houses }, { data: duesPaid }, { data: expenses }, { data: chapters }, { data: fee }] = await Promise.all([
    sb.rpc('finance_summary', { p_fy: fy }),
    sb.from('payments').select('*, household:households(head_name), chapter:chapters(name)').eq('status', 'pending').order('created_at'),
    sb.from('households').select('id,head_name,chapter_id,waiver_amount,chapter:chapters(name), people(id,deceased), household_private(phone)').eq('status', 'approved').order('head_name').limit(400),
    sb.from('payments').select('household_id,amount').eq('fy', fy).eq('kind', 'dues').eq('status', 'confirmed'),
    sb.from('expenses').select('*, chapter:chapters(name)').gte('spent_on', `${y}-04-01`).lt('spent_on', `${y + 1}-04-01`).order('spent_on', { ascending: false }).limit(60),
    sb.from('chapters').select('id,name').order('name'),
    sb.from('fee_years').select('per_member').eq('fy', fy).maybeSingle(),
  ]);
  const s = (Array.isArray(summaryRows) ? summaryRows[0] : summaryRows) ?? { income_dues: 0, income_occasion: 0, income_donation: 0, expenses: 0 };
  const income = Number(s.income_dues) + Number(s.income_occasion) + Number(s.income_donation);
  const perMember = Number(fee?.per_member ?? 0);

  const urls = new Map<string, string>();
  const shots = (pending ?? []).map((p) => p.screenshot_path).filter(Boolean) as string[];
  if (shots.length) (await sb.storage.from('payments').createSignedUrls(shots, 3600)).data?.forEach((x) => x.path && x.signedUrl && urls.set(x.path, x.signedUrl));

  const paidBy = new Map<string, number>();
  (duesPaid ?? []).forEach((p) => paidBy.set(p.household_id, (paidBy.get(p.household_id) ?? 0) + Number(p.amount)));
  const rows = (houses ?? []).map((h: any) => {
    const members = (h.people ?? []).filter((p: any) => !p.deceased).length;
    const total = Math.max(members * perMember - Number(h.waiver_amount ?? 0), 0);
    const paid = paidBy.get(h.id) ?? 0;
    const phone = Array.isArray(h.household_private) ? h.household_private[0]?.phone : h.household_private?.phone;
    return { ...h, members, total, paid, balance: Math.max(total - paid, 0), phone };
  });
  const byChapter = new Map<string, { name: string; total: number; paid: number }>();
  rows.forEach((r) => { const k = r.chapter?.name ?? '—'; const v = byChapter.get(k) ?? { name: k, total: 0, paid: 0 }; v.total += r.total; v.paid += Math.min(r.paid, r.total); byChapter.set(k, v); });
  const unpaid = rows.filter((r) => r.balance > 0);
  const remind = (r: any) => `https://wa.me/${(r.phone ?? '').replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}?text=${encodeURIComponent(t(`Namaste ${r.head_name} ji, the samaj dues for ${fy} (${inr(r.balance)}) are pending. Please pay by UPI on the portal. Thank you.`, `नमस्ते ${r.head_name} जी, समाज का ${fy} का शुल्क (${inr(r.balance)}) शेष है। कृपया पोर्टल पर UPI से जमा करें। धन्यवाद।`))}`;

  return (
    <>
      <PageHead kicker={`${t('Treasurer', 'कोषाध्यक्ष')} · ${fy}`} title={t('Finance', 'वित्त')}>
        <a href={`/finance/export?fy=${fy}`} className="btn-alt btn btn-sm">{t('Export for audit (CSV)', 'ऑडिट के लिए निर्यात (CSV)')}</a>
      </PageHead>
      <Flash ok={sp.ok} err={sp.err} />

      <div className="grid-auto">
        <div className="card"><span className="lbl">{t('Income', 'आय')}</span><b className="block font-display text-3xl font-normal tabular-nums text-good">{inr(income)}</b></div>
        <div className="card"><span className="lbl">{t('Spent', 'खर्च')}</span><b className="block font-display text-3xl font-normal tabular-nums text-bad">{inr(s.expenses)}</b></div>
        <div className="card"><span className="lbl">{t('Balance', 'शेष')}</span><b className="block font-display text-3xl font-normal tabular-nums">{inr(income - Number(s.expenses))}</b></div>
      </div>
      <section className="card flex flex-col gap-3">
        <h2>{t('Where the income came from', 'आय के स्रोत')}</h2>
        {[[t('Annual dues', 'वार्षिक शुल्क'), s.income_dues], [t('Occasion contributions', 'अवसर पर सहयोग'), s.income_occasion], [t('Donations', 'दान'), s.income_donation]].map(([k, v]) => (
          <div key={String(k)}><div className="flex justify-between gap-2"><span>{k}</span><span className="tabular-nums text-sm text-muted">{inr(v as number)}</span></div><div className="bar"><i style={{ width: `${income ? (Number(v) / income) * 100 : 0}%` }} /></div></div>
        ))}
      </section>

      <section className="card flex flex-col gap-3">
        <h2>{t('Waiting for confirmation', 'पुष्टि की प्रतीक्षा में')} <span className="pill-warn">{(pending ?? []).length}</span></h2>
        {(pending ?? []).length === 0 && <Empty>{t('All caught up.', 'सब पूरा है।')}</Empty>}
        {(pending ?? []).map((p: any) => (
          <div key={p.id} className="flex flex-wrap items-start gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
            <div className="min-w-0 flex-1">
              <b>{p.household?.head_name}</b> <span className="text-sm text-muted">· {p.chapter?.name} · {fmtDate(p.created_at, lang)}</span>
              <p className="text-sm"><b className="tabular-nums">{inr(p.amount)}</b> · {p.kind === 'dues' ? t('Annual dues', 'वार्षिक शुल्क') : p.kind === 'occasion' ? `${t('Occasion', 'अवसर')}: ${p.occasion ?? ''}` : t('Donation', 'दान')} · {p.utr ? `UTR ${p.utr}` : t('no UTR', 'UTR नहीं')}
                {p.screenshot_path && urls.get(p.screenshot_path) && <> · <a className="font-semibold text-brand underline" href={urls.get(p.screenshot_path)} target="_blank" rel="noreferrer">{t('screenshot', 'स्क्रीनशॉट')}</a></>}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form action={confirmPayment}><input type="hidden" name="id" value={p.id} /><Submit className="btn btn-sm">{t('Confirm', 'पुष्टि करें')}</Submit></form>
              <form action={rejectPayment} className="flex gap-1"><input type="hidden" name="id" value={p.id} /><input name="note" placeholder={t('Reason', 'कारण')} className="input !w-32 !py-1" aria-label="Reason" /><Submit className="btn-bad btn btn-sm">{t('Return', 'लौटाएँ')}</Submit></form>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={recordPayment} className="card flex flex-col gap-3">
          <h2>{t('Record cash or bank payment', 'नकद या बैंक भुगतान दर्ज करें')}</h2>
          <Field label={t('Family', 'परिवार')}>
            <select name="household" required className="input" defaultValue=""><option value="" disabled>{t('Choose…', 'चुनें…')}</option>{rows.map((r) => <option key={r.id} value={r.id}>{r.head_name} · {r.chapter?.name}</option>)}</select>
          </Field>
          <div className="form-grid">
            <Field label={t('For', 'किसलिए')}><select name="kind" className="input"><option value="dues">{t('Annual dues', 'वार्षिक शुल्क')}</option><option value="occasion">{t('Occasion', 'अवसर')}</option><option value="donation">{t('Donation', 'दान')}</option></select></Field>
            <Field label={t('Occasion (if any)', 'अवसर (यदि हो)')}><select name="occasion" className="input" defaultValue="">{<option value="">—</option>}{OCCASIONS.map((o) => <option key={o.key} value={o.key}>{lang === 'hi' ? o.hi : o.en}</option>)}</select></Field>
            <Field label={t('Amount (₹)', 'राशि (₹)')}><input name="amount" type="number" min="1" required className="input" /></Field>
            <Field label={t('Mode', 'माध्यम')}><select name="mode" className="input"><option value="cash">{t('Cash', 'नकद')}</option><option value="bank">{t('Bank transfer', 'बैंक ट्रांसफर')}</option></select></Field>
            <Field label={t('Receipt book / reference', 'रसीद बुक / संदर्भ')}><input name="ref" className="input" /></Field>
            <Field label={t('Name for the board', 'सूचना पट के लिए नाम')}><input name="label" className="input" /></Field>
          </div>
          <div><Submit className="btn-gold">{t('Record and issue receipt', 'दर्ज करें और रसीद जारी करें')}</Submit></div>
        </form>

        <section className="card flex flex-col gap-3">
          <h2>{t('Collection by chapter', 'शाखा अनुसार वसूली')}</h2>
          {[...byChapter.values()].length === 0 && <Empty>{t('No approved families yet.', 'अभी कोई स्वीकृत परिवार नहीं।')}</Empty>}
          {[...byChapter.values()].map((ch) => {
            const pct = ch.total ? Math.round((ch.paid / ch.total) * 100) : 0;
            return <div key={ch.name}><div className="flex justify-between gap-2"><span>{ch.name}</span><span className="tabular-nums text-sm text-muted">{inr(ch.paid)} / {inr(ch.total)} · {pct}%</span></div><div className="bar"><i style={{ width: `${pct}%` }} /></div></div>;
          })}
          {c.isAdmin && (
            <form action={setFee} className="mt-2 flex flex-wrap items-end gap-2 border-t border-line pt-3">
              <input type="hidden" name="fy" value={fy} />
              <Field label={`${t('Yearly fee per member', 'प्रति सदस्य वार्षिक शुल्क')} (${fy})`}><input name="per_member" type="number" min="0" defaultValue={perMember || 1000} className="input !w-32" /></Field>
              <Submit className="btn-alt">{t('Save fee', 'शुल्क सहेजें')}</Submit>
            </form>
          )}
        </section>
      </div>

      <section className="card flex flex-col gap-3">
        <h2>{t('Families with dues pending', 'जिन परिवारों का शुल्क शेष है')} <span className="pill-warn">{unpaid.length}</span></h2>
        {unpaid.length === 0 ? <Empty>{perMember ? t('Everyone has paid.', 'सभी ने जमा कर दिया है।') : t('Set the yearly fee to see dues.', 'शुल्क देखने के लिए वार्षिक शुल्क तय करें।')}</Empty> : (
          <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('Family', 'परिवार')}</th><th>{t('Chapter', 'शाखा')}</th><th className="text-right">{t('Members', 'सदस्य')}</th><th className="text-right">{t('Balance', 'शेष')}</th><th /></tr></thead><tbody>
            {unpaid.slice(0, 150).map((r) => (
              <tr key={r.id}><td><b>{r.head_name}</b></td><td>{r.chapter?.name}</td><td className="text-right tabular-nums">{r.members}</td><td className="text-right tabular-nums">{inr(r.balance)}</td>
                <td className="text-right">{r.phone ? <a className="btn-alt btn btn-sm" href={remind(r)} target="_blank" rel="noreferrer">{t('Remind on WhatsApp', 'WhatsApp पर याद दिलाएँ')}</a> : <span className="text-sm text-muted">{t('no phone', 'फोन नहीं')}</span>}</td></tr>
            ))}
          </tbody></table></div>
        )}
      </section>

      <section className="card flex flex-col gap-4">
        <h2>{t('Expenses', 'खर्च')}</h2>
        <form action={addExpense} className="form-grid lg:grid-cols-3">
          <Field label={t('What was it for', 'किसलिए खर्च हुआ')}><input name="description" required className="input" /></Field>
          <Field label={t('Amount (₹)', 'राशि (₹)')}><input name="amount" type="number" min="1" required className="input" /></Field>
          <Field label={t('Date', 'दिनांक')}><input name="spent_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input" /></Field>
          <Field label={t('Category', 'श्रेणी')}><select name="category" className="input">{['hall', 'food', 'scholarship', 'printing', 'travel', 'general'].map((k) => <option key={k}>{k}</option>)}</select></Field>
          {c.isAdmin && <Field label={t('Chapter', 'शाखा')}><select name="chapter" className="input" defaultValue="all"><option value="all">{t('Central', 'केंद्रीय')}</option>{(chapters ?? []).map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</select></Field>}
          <div className="flex items-end"><Submit className="btn-gold">{t('Add expense', 'खर्च जोड़ें')}</Submit></div>
        </form>
        {(expenses ?? []).length > 0 && (
          <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('Date', 'दिनांक')}</th><th>{t('Entry', 'विवरण')}</th><th>{t('Chapter', 'शाखा')}</th><th className="text-right">{t('Amount', 'राशि')}</th><th /></tr></thead><tbody>
            {(expenses ?? []).map((e: any) => (
              <tr key={e.id}><td>{fmtDate(e.spent_on, lang)}</td><td>{e.description} <span className="text-sm text-muted">· {e.category}</span></td><td>{e.chapter?.name ?? t('Central', 'केंद्रीय')}</td><td className="text-right tabular-nums text-bad">− {inr(e.amount)}</td>
                <td className="text-right"><form action={deleteExpense}><input type="hidden" name="id" value={e.id} /><Submit className="btn-bad btn btn-sm">✕</Submit></form></td></tr>
            ))}
          </tbody></table></div>
        )}
      </section>
    </>
  );
}

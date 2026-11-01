'use client';
import { useState } from 'react';
import { ShotInput } from './shot-input';
import { Submit } from './submit';

type Opt = { key: string; label: string; amount: number };
export type PayLabels = Record<string, string>;

/** Two tabs: annual dues, and voluntary contributions for an occasion. Chips fill the amount instantly. */
export function PayForms({
  action, userId, balance, headName, occasions, funds, L, initialTab,
}: {
  action: (fd: FormData) => Promise<void>; userId: string; balance: number; headName: string;
  occasions: Opt[]; funds: { key: string; label: string }[]; L: PayLabels; initialTab: 'dues' | 'occasion';
}) {
  const [tab, setTab] = useState<'dues' | 'occasion'>(initialTab);
  const [occ, setOcc] = useState(occasions[0].key);
  const [amount, setAmount] = useState(String(occasions[0].amount));
  const [dues, setDues] = useState(balance ? String(balance) : '');
  const isDonation = occ === 'Donation';

  return (
    <section id="pay" className="card flex flex-col gap-4">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-surface2 p-1">
        {(['dues', 'occasion'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`min-h-[44px] rounded-lg px-2 font-semibold transition ${tab === k ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}>
            {k === 'dues' ? L.tabDues : L.tabOccasion}
          </button>
        ))}
      </div>

      {tab === 'dues' ? (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="kind" value="dues" />
          <p className="text-muted">{L.duesHelp}</p>
          <div className="flex flex-wrap gap-1.5">
            {balance > 0 && <button type="button" className="chip" aria-pressed={dues === String(balance)} onClick={() => setDues(String(balance))}>{L.full}: ₹{balance.toLocaleString('en-IN')}</button>}
            {[1000, 2000, 4000].map((a) => <button key={a} type="button" className="chip" aria-pressed={dues === String(a)} onClick={() => setDues(String(a))}>₹{a.toLocaleString('en-IN')}</button>)}
          </div>
          <div className="form-grid">
            <div className="field"><label htmlFor="d-amt">{L.amount}</label><input id="d-amt" name="amount" type="number" inputMode="numeric" min="1" required className="input" value={dues} onChange={(e) => setDues(e.target.value)} /></div>
            <div className="field"><label htmlFor="d-utr">{L.utr}</label><input id="d-utr" name="utr" className="input" placeholder={L.utrHint} /></div>
            <ShotInput userId={userId} label={L.shot} okLabel={L.attached} />
          </div>
          <div><Submit className="btn-gold">{L.send}</Submit></div>
        </form>
      ) : (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="kind" value={isDonation ? 'donation' : 'occasion'} />
          <input type="hidden" name="occasion" value={isDonation ? '' : occ} />
          <p className="text-muted">{L.occHelp}</p>
          <div className="flex flex-wrap gap-1.5">
            {occasions.map((o) => <button key={o.key} type="button" className="chip" aria-pressed={occ === o.key} onClick={() => { setOcc(o.key); setAmount(String(o.amount)); }}>{o.label}</button>)}
            <button type="button" className="chip" aria-pressed={isDonation} onClick={() => setOcc('Donation')}>{L.donation}</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[501, 1100, 2100, 5100, 11000].map((a) => <button key={a} type="button" className="chip" aria-pressed={amount === String(a)} onClick={() => setAmount(String(a))}>₹{a.toLocaleString('en-IN')}</button>)}
          </div>
          <div className="form-grid">
            <div className="field"><label htmlFor="o-amt">{L.amount}</label><input id="o-amt" name="amount" type="number" inputMode="numeric" min="1" required className="input" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="field"><label htmlFor="o-fund">{L.fund}</label><select id="o-fund" name="fund" className="input" defaultValue="general">{funds.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select></div>
            <div className="field"><label htmlFor="o-label">{L.familyName}</label><input id="o-label" name="label" className="input" defaultValue={headName} /></div>
            <div className="field"><label htmlFor="o-utr">{L.utr}</label><input id="o-utr" name="utr" className="input" placeholder={L.utrHint} /></div>
            <ShotInput userId={userId} label={L.shot} okLabel={L.attached} />
          </div>
          <fieldset className="flex flex-col gap-2 rounded-xl border border-line p-3">
            <legend className="px-1 text-[0.8rem] font-semibold text-muted">{L.whoSees}</legend>
            <label className="flex min-h-[36px] items-center gap-2"><input type="radio" name="visibility" value="amount" />{L.visAmount}</label>
            <label className="flex min-h-[36px] items-center gap-2"><input type="radio" name="visibility" value="name" defaultChecked />{L.visName}</label>
            <label className="flex min-h-[36px] items-center gap-2"><input type="radio" name="visibility" value="private" />{L.visPrivate}</label>
          </fieldset>
          <div><Submit className="btn-gold">{L.send}</Submit></div>
        </form>
      )}
    </section>
  );
}

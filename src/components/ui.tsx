import { initials } from '@/lib/utils';

export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null;
  return (
    <div role="status" className={`rounded-lg border px-4 py-2.5 font-semibold ${err ? 'border-bad bg-bad-soft text-bad' : 'border-good bg-good-soft text-good'}`}>
      {err || ok}
    </div>
  );
}

export function PageHead({ kicker, title, sub, children }: { kicker?: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        {kicker && <span className="lbl">{kicker}</span>}
        <h1>{title}</h1>
        {sub && <p className="max-w-prose text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Avatar({ name, female }: { name: string; female?: boolean }) {
  return (
    <span className={`grid h-10 w-10 flex-none place-items-center rounded-full font-bold ${female ? 'bg-accent-soft text-warn' : 'bg-brand-soft text-brand'}`}>
      {initials(name) || '?'}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card-flat text-center text-muted">{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span className="flabel">{label}</span>
      {children}
    </div>
  );
}

export function DateBadge({ date, lang }: { date: string; lang: 'hi' | 'en' }) {
  const d = new Date(date);
  const mon = d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' }).toUpperCase();
  return (
    <div className="w-14 flex-none overflow-hidden rounded-xl border border-line2 bg-surface text-center">
      <i className="block bg-accent py-px text-[0.68rem] font-bold not-italic tracking-wider text-accent-ink">{mon}</i>
      <b className="block font-display text-[1.4rem] font-normal leading-[1.3]">{d.getDate()}</b>
    </div>
  );
}

export function WhatsAppShare({ text, label }: { text: string; label: string }) {
  return (
    <a className="btn-alt btn-sm btn" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

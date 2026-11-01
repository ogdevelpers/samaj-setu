import { requireStaff } from '@/lib/ctx';
import { setWaiver } from '../actions';
import { Empty, Flash, PageHead } from '@/components/ui';
import { Submit } from '@/components/submit';

export default async function Families({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff(['admin', 'coordinator']);
  const { t, sb } = c;
  let query = sb.from('households').select('id,head_name,waiver_amount,chapter:chapters(name), people(id)').eq('status', 'approved').order('head_name').limit(200);
  const q = (sp.q ?? '').trim().replace(/[%,()]/g, ' ');
  if (q) query = query.ilike('head_name', `%${q}%`);
  const { data } = await query;
  return (
    <>
      <PageHead kicker={t('Approved families', 'स्वीकृत परिवार')} title={t('Families', 'परिवार')} sub={t('Give a waiver for a family that cannot pay in full.', 'जो परिवार पूरा शुल्क नहीं दे सकता, उसे छूट दें।')} />
      <Flash ok={sp.ok} err={sp.err} />
      <form className="flex gap-2"><input name="q" defaultValue={sp.q ?? ''} className="input" placeholder={t('Search family name', 'परिवार का नाम खोजें')} aria-label="Search" /><button className="btn">{t('Search', 'खोजें')}</button></form>
      {(data ?? []).length === 0 && <Empty>{t('No families found.', 'कोई परिवार नहीं मिला।')}</Empty>}
      <div className="grid gap-3">
        {(data ?? []).map((h: any) => (
          <div key={h.id} className="card flex flex-wrap items-center gap-3 !p-3">
            <div className="min-w-0 flex-1"><b>{h.head_name}</b><p className="text-sm text-muted">{h.chapter?.name} · {(h.people ?? []).length} {t('people', 'सदस्य')}</p></div>
            <form action={setWaiver} className="flex items-center gap-2"><input type="hidden" name="id" value={h.id} />
              <label className="text-sm text-muted" htmlFor={`w-${h.id}`}>{t('Waiver ₹', 'छूट ₹')}</label>
              <input id={`w-${h.id}`} name="waiver" type="number" min="0" defaultValue={h.waiver_amount} className="input !w-28" />
              <Submit className="btn-alt btn btn-sm">{t('Save', 'सहेजें')}</Submit></form>
          </div>
        ))}
      </div>
    </>
  );
}

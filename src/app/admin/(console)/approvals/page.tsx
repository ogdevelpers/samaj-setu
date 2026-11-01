import { requireStaff } from '@/lib/ctx';
import { approveHousehold, rejectHousehold } from '../actions';
import { Empty, Flash, PageHead } from '@/components/ui';
import { Submit } from '@/components/submit';
import { fmtDate } from '@/lib/utils';

export default async function Approvals({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff(['admin', 'coordinator']);
  const { t, lang, sb } = c;
  const [{ data }, { data: places }] = await Promise.all([
    sb.from('households').select('id,head_name,created_at,place_state,place_district,place_area,chapter:chapters(name,district,area,state), people(full_name,relation,dob)').eq('status', 'pending').order('created_at'),
    sb.from('chapters').select('id,name,district,area').order('name'),
  ]);
  return (
    <>
      <PageHead kicker={t('Verify new families', 'नए परिवारों की जाँच')} title={t('Approvals', 'स्वीकृतियाँ')} sub={t('Check that you know the family, then approve. They get access straight away.', 'देखें कि आप परिवार को जानते हैं, फिर स्वीकृत करें। उन्हें तुरंत पहुँच मिल जाती है।')} />
      <Flash ok={sp.ok} err={sp.err} />
      {(data ?? []).length === 0 && <Empty>{t('Nothing is waiting. New registrations appear here.', 'कुछ लंबित नहीं। नए पंजीकरण यहाँ दिखेंगे।')}</Empty>}
      {(data ?? []).map((h: any) => (
        <article key={h.id} className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><b className="text-[1.05rem]">{h.head_name}</b>
              <p className="text-sm text-muted">{h.chapter ? `${h.chapter.state} › ${h.chapter.district} › ${h.chapter.area}` : `${t('They wrote', 'उन्होंने लिखा')}: ${[h.place_state, h.place_district, h.place_area].filter(Boolean).join(' › ')}`} · {fmtDate(h.created_at, lang)}</p></div>
            <span className="pill">{(h.people ?? []).length} {t('people', 'सदस्य')}</span>
          </div>
          <p className="text-sm text-muted">{(h.people ?? []).map((p: any) => `${p.full_name} (${p.relation})`).join(', ')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <form action={approveHousehold} className="flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={h.id} />
              {!h.chapter && (() => {
                const guess = (places ?? []).find((p: any) => p.area?.toLowerCase() === (h.place_area ?? '').toLowerCase())?.id ?? '__new';
                return (
                  <select name="chapter" defaultValue={guess} className="input !w-auto" aria-label="Place">
                    <option value="__new">{t('Create new place', 'नया स्थान बनाएँ')}: {h.place_district && h.place_district !== h.place_area ? `${h.place_district} - ` : ''}{h.place_area}</option>
                    {(places ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                );
              })()}
              <Submit className="btn">{t('Approve', 'स्वीकृत करें')}</Submit></form>
            <form action={rejectHousehold} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={h.id} /><input name="note" className="input !w-48" placeholder={t('Reason to return', 'लौटाने का कारण')} aria-label="Reason" /><Submit className="btn-bad btn">{t('Return', 'लौटाएँ')}</Submit></form>
          </div>
        </article>
      ))}
    </>
  );
}

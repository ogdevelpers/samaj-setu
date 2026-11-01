import { requireStaff } from '@/lib/ctx';
import { createChapter, deleteChapter } from '../actions';
import { Empty, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';

const STATES = ['Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh', 'Delhi', 'Haryana', 'Punjab', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh', 'West Bengal', 'Bihar', 'Chhattisgarh', 'Odisha', 'Kerala'];

export default async function Chapters({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff(['admin']);
  const { t, sb } = c;
  const [{ data: chapters }, { data: houses }] = await Promise.all([
    sb.from('chapters').select('id,name,state,district,area').order('state').order('district'),
    sb.from('households').select('chapter_id').eq('status', 'approved'),
  ]);
  const n = new Map<string, number>();
  (houses ?? []).forEach((h) => n.set(h.chapter_id, (n.get(h.chapter_id) ?? 0) + 1));
  return (
    <>
      <PageHead kicker={t('Where your members live', 'आपके सदस्य कहाँ रहते हैं')} title={t('Places (chapters)', 'स्थान (शाखाएँ)')}
        sub={t('A place is a city or village, for example Jaipur or Sanganer. Each family joins one place. That place\'s coordinator approves them and its treasurer collects dues.', 'स्थान कोई शहर या गाँव है, जैसे जयपुर या सांगानेर। हर परिवार एक स्थान से जुड़ता है। उस स्थान का संयोजक उन्हें स्वीकृत करता है और कोषाध्यक्ष शुल्क लेता है।')} />
      <Flash ok={sp.ok} err={sp.err} />
      <form action={createChapter} className="card flex flex-col gap-3">
        <h2>{t('Add a place', 'स्थान जोड़ें')}</h2>
        <div className="form-grid">
          <Field label={t('State', 'राज्य')}><input name="state" list="states" required className="input" placeholder="Rajasthan" /></Field>
          <Field label={t('District / city', 'जिला / शहर')}><input name="district" required className="input" placeholder="Jaipur" /></Field>
          <Field label={t('Village / area', 'गाँव / क्षेत्र')}><input name="area" required className="input" placeholder="Sanganer" /></Field>
          <Field label={t('Name (optional)', 'नाम (वैकल्पिक)')}><input name="name" className="input" placeholder="Jaipur - Sanganer" /></Field>
        </div>
        <datalist id="states">{STATES.map((s) => <option key={s} value={s} />)}</datalist>
        <p className="text-sm text-muted">{t('If the whole city is one group, write the city name in both district and area.', 'यदि पूरा शहर एक ही समूह है, तो जिला और क्षेत्र दोनों में शहर का नाम लिखें।')}</p>
        <div><Submit className="btn-gold">{t('Add place', 'स्थान जोड़ें')}</Submit></div>
      </form>
      {(chapters ?? []).length === 0 ? <Empty>{t('No places yet. Add the first one above.', 'अभी कोई स्थान नहीं। ऊपर पहला जोड़ें।')}</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(chapters ?? []).map((ch) => (
            <div key={ch.id} className="card flex items-center gap-3 !p-4">
              <div className="min-w-0 flex-1"><b>{ch.name}</b><p className="text-sm text-muted">{ch.state} › {ch.district} › {ch.area}</p></div>
              <span className="pill">{n.get(ch.id) ?? 0} {t('families', 'परिवार')}</span>
              {!(n.get(ch.id)) && <form action={deleteChapter}><input type="hidden" name="id" value={ch.id} /><Submit className="btn-bad btn btn-sm" pendingText="…">✕</Submit></form>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

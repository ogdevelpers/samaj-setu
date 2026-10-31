import Link from 'next/link';
import { requireRole } from '@/lib/ctx';
import { approveHousehold, approveListing, createChapter, createScholarship, rejectHousehold, reviewApplication, setRole, setWaiver } from './actions';
import { Empty, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { fmtDate, inr } from '@/lib/utils';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireRole((x) => x.canPost);
  const { t, lang, sb } = c;
  const all: [string, string, boolean][] = [
    ['approvals', t('Approvals', 'स्वीकृतियाँ'), true], ['households', t('Families', 'परिवार'), true], ['content', t('Listings & scholarships', 'सूचियाँ व छात्रवृत्ति'), true],
    ['chapters', t('Chapters', 'शाखाएँ'), c.isAdmin], ['users', t('Roles', 'भूमिकाएँ'), c.isAdmin], ['audit', t('Activity log', 'गतिविधि'), c.isAdmin],
  ];
  const tabs = all.filter((x) => x[2]);
  const tab = tabs.some((x) => x[0] === sp.tab) ? sp.tab! : 'approvals';
  let body: React.ReactNode = null;

  if (tab === 'approvals') {
    const { data } = await sb.from('households').select('id,head_name,created_at,chapter:chapters(name,district,area), people(id)').eq('status', 'pending').order('created_at');
    body = (
      <>
        {(data ?? []).length === 0 && <Empty>{t('Nothing waiting for approval.', 'स्वीकृति के लिए कुछ लंबित नहीं।')}</Empty>}
        {(data ?? []).map((h: any) => (
          <div key={h.id} className="flex flex-wrap items-center gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
            <div className="min-w-0 flex-1"><b>{h.head_name}</b><p className="text-sm text-muted">{h.chapter?.district} › {h.chapter?.area} · {(h.people ?? []).length} {t('people', 'सदस्य')} · {fmtDate(h.created_at, lang)}</p></div>
            <form action={approveHousehold}><input type="hidden" name="id" value={h.id} /><Submit className="btn btn-sm">{t('Approve', 'स्वीकृत करें')}</Submit></form>
            <form action={rejectHousehold} className="flex gap-1"><input type="hidden" name="id" value={h.id} /><input name="note" className="input !w-36 !py-1" placeholder={t('Reason', 'कारण')} aria-label="Reason" /><Submit className="btn-bad btn btn-sm">{t('Return', 'लौटाएँ')}</Submit></form>
          </div>
        ))}
      </>
    );
  } else if (tab === 'households') {
    const { data } = await sb.from('households').select('id,head_name,waiver_amount,chapter:chapters(name), people(id)').eq('status', 'approved').order('head_name').limit(300);
    body = (
      <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('Family', 'परिवार')}</th><th>{t('Chapter', 'शाखा')}</th><th className="text-right">{t('Members', 'सदस्य')}</th><th>{t('Waiver (₹)', 'छूट (₹)')}</th></tr></thead><tbody>
        {(data ?? []).map((h: any) => (
          <tr key={h.id}><td><b>{h.head_name}</b></td><td>{h.chapter?.name}</td><td className="text-right tabular-nums">{(h.people ?? []).length}</td>
            <td><form action={setWaiver} className="flex gap-1"><input type="hidden" name="id" value={h.id} /><input name="waiver" type="number" min="0" defaultValue={h.waiver_amount} className="input !w-24 !py-1" aria-label="Waiver" /><Submit className="btn-alt btn btn-sm">{t('Save', 'सहेजें')}</Submit></form></td></tr>
        ))}
      </tbody></table></div>
    );
  } else if (tab === 'content') {
    const [{ data: lists }, { data: apps }, { data: sch }] = await Promise.all([
      sb.from('listings').select('id,kind,title,body,contact,chapter:chapters(name)').eq('approved', false).order('created_at'),
      c.isAdmin ? sb.from('scholarship_applications').select('id,student_name,institution,marks,note,status, scholarship:scholarships(title)').eq('status', 'submitted').order('created_at') : Promise.resolve({ data: [] as any[] }),
      sb.from('scholarships').select('id,title,amount,deadline').order('deadline'),
    ]);
    body = (
      <>
        <h2>{t('Listings waiting for approval', 'स्वीकृति के लिए सूचियाँ')}</h2>
        {(lists ?? []).length === 0 && <Empty>{t('None waiting.', 'कोई लंबित नहीं।')}</Empty>}
        {(lists ?? []).map((l: any) => (
          <div key={l.id} className="flex flex-wrap items-center gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
            <div className="min-w-0 flex-1"><b>{l.title}</b> <span className="pill">{l.kind}</span><p className="whitespace-pre-line text-sm">{l.body}</p><p className="text-sm text-muted">{l.chapter?.name} · {l.contact}</p></div>
            <form action={approveListing}><input type="hidden" name="id" value={l.id} /><Submit className="btn btn-sm">{t('Approve', 'स्वीकृत करें')}</Submit></form>
          </div>
        ))}
        {c.isAdmin && (
          <>
            <h2 className="mt-4">{t('Scholarship applications', 'छात्रवृत्ति आवेदन')}</h2>
            {(apps ?? []).length === 0 && <Empty>{t('None waiting.', 'कोई लंबित नहीं।')}</Empty>}
            {(apps ?? []).map((a: any) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="min-w-0 flex-1"><b>{a.student_name}</b> <span className="text-sm text-muted">· {a.scholarship?.title}</span><p className="text-sm">{a.institution} · {a.marks}</p><p className="text-sm text-muted">{a.note}</p></div>
                {['approved', 'declined'].map((s) => <form key={s} action={reviewApplication}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={s} /><Submit className={s === 'approved' ? 'btn btn-sm' : 'btn-bad btn btn-sm'}>{s === 'approved' ? t('Approve', 'स्वीकृत करें') : t('Decline', 'अस्वीकार')}</Submit></form>)}
              </div>
            ))}
            <form action={createScholarship} className="card-flat mt-4 flex flex-col gap-2">
              <h2>{t('Add a scholarship', 'छात्रवृत्ति जोड़ें')}</h2>
              <div className="form-grid">
                <Field label={t('Title', 'शीर्षक')}><input name="title" required className="input" /></Field>
                <Field label={t('Amount (₹)', 'राशि (₹)')}><input name="amount" type="number" className="input" /></Field>
                <Field label={t('Last date', 'अंतिम तिथि')}><input name="deadline" type="date" className="input" /></Field>
                <Field label={t('Who can apply', 'कौन आवेदन कर सकता है')}><input name="description" className="input" /></Field>
              </div>
              <div><Submit className="btn-gold">{t('Add', 'जोड़ें')}</Submit></div>
              <p className="text-sm text-muted">{(sch ?? []).length} {t('scholarships listed', 'छात्रवृत्तियाँ सूचीबद्ध')}</p>
            </form>
          </>
        )}
      </>
    );
  } else if (tab === 'chapters') {
    const [{ data: chapters }, { data: counts }] = await Promise.all([
      sb.from('chapters').select('id,name,state,district,area').order('state').order('district'),
      sb.from('households').select('chapter_id').eq('status', 'approved'),
    ]);
    const n = new Map<string, number>();
    (counts ?? []).forEach((h) => n.set(h.chapter_id, (n.get(h.chapter_id) ?? 0) + 1));
    body = (
      <>
        <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('Chapter', 'शाखा')}</th><th>{t('State', 'राज्य')}</th><th>{t('District', 'जिला')}</th><th>{t('Area', 'क्षेत्र')}</th><th className="text-right">{t('Families', 'परिवार')}</th></tr></thead><tbody>
          {(chapters ?? []).map((ch) => <tr key={ch.id}><td><b>{ch.name}</b></td><td>{ch.state}</td><td>{ch.district}</td><td>{ch.area}</td><td className="text-right tabular-nums">{n.get(ch.id) ?? 0}</td></tr>)}
        </tbody></table></div>
        <form action={createChapter} className="card-flat flex flex-col gap-2">
          <h2>{t('Add a chapter', 'शाखा जोड़ें')}</h2>
          <div className="form-grid">
            <Field label={t('Chapter name', 'शाखा का नाम')}><input name="name" required className="input" placeholder="Jaipur - Sanganer" /></Field>
            <Field label={t('State', 'राज्य')}><input name="state" required className="input" /></Field>
            <Field label={t('District', 'जिला')}><input name="district" required className="input" /></Field>
            <Field label={t('Village / area', 'गाँव / क्षेत्र')}><input name="area" required className="input" /></Field>
          </div>
          <div><Submit className="btn-gold">{t('Add chapter', 'शाखा जोड़ें')}</Submit></div>
        </form>
      </>
    );
  } else if (tab === 'users') {
    const [{ data: users }, { data: chapters }] = await Promise.all([
      sb.from('profiles').select('id,email,full_name,role,chapter_id').order('created_at', { ascending: false }).limit(200),
      sb.from('chapters').select('id,name').order('name'),
    ]);
    body = (
      <>
        <p className="text-sm text-muted">{t('Make a person a coordinator or treasurer of one chapter. Admins see every chapter.', 'किसी को एक शाखा का संयोजक या कोषाध्यक्ष बनाएँ। प्रबंधक सभी शाखाएँ देखते हैं।')}</p>
        <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('Person', 'व्यक्ति')}</th><th>{t('Role', 'भूमिका')}</th><th>{t('Chapter', 'शाखा')}</th><th /></tr></thead><tbody>
          {(users ?? []).map((u) => (
            <tr key={u.id}>
              <td><b>{u.full_name || '—'}</b><p className="text-sm text-muted">{u.email}</p></td>
              <td colSpan={3}>
                <form action={setRole} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} className="input !w-36 !py-1" aria-label="Role"><option value="member">member</option><option value="coordinator">coordinator</option><option value="treasurer">treasurer</option><option value="admin">admin</option></select>
                  <select name="chapter" defaultValue={u.chapter_id ?? ''} className="input !w-44 !py-1" aria-label="Chapter"><option value="">—</option>{(chapters ?? []).map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</select>
                  <Submit className="btn-alt btn btn-sm">{t('Save', 'सहेजें')}</Submit></form>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      </>
    );
  } else {
    const { data } = await sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100);
    body = (
      <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>{t('When', 'कब')}</th><th>{t('What', 'क्या')}</th><th>{t('Detail', 'विवरण')}</th></tr></thead><tbody>
        {(data ?? []).map((a) => <tr key={a.id}><td className="whitespace-nowrap tabular-nums">{new Date(a.created_at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</td><td>{a.action}</td><td className="break-all text-sm text-muted">{a.detail}</td></tr>)}
      </tbody></table></div>
    );
  }

  return (
    <>
      <PageHead kicker={t('Committee', 'समिति')} title={t('Admin', 'प्रबंधन')} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="card flex flex-col gap-4">
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
          {tabs.map(([k, v]) => <Link key={k} role="tab" aria-selected={tab === k} href={`/admin?tab=${k}`} className={`whitespace-nowrap border-b-[3px] px-3 py-2 font-semibold ${tab === k ? 'border-accent text-ink' : 'border-transparent text-muted'}`}>{v}</Link>)}
        </div>
        {body}
      </div>
    </>
  );
}

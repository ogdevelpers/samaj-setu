import { requireStaff } from '@/lib/ctx';
import { approveListing, createScholarship, reviewApplication } from '../actions';
import { Empty, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';

export default async function CommunityAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff(['admin', 'coordinator']);
  const { t, sb } = c;
  const [{ data: lists }, { data: apps }] = await Promise.all([
    sb.from('listings').select('id,kind,title,body,contact,chapter:chapters(name)').eq('approved', false).order('created_at'),
    c.isAdmin ? sb.from('scholarship_applications').select('id,student_name,institution,marks,note, scholarship:scholarships(title)').eq('status', 'submitted').order('created_at') : Promise.resolve({ data: [] as any[] }),
  ]);
  const kind: Record<string, string> = { business: t('Business', 'व्यापार'), job: t('Job', 'रोजगार'), vivah: t('Vivah parichay', 'विवाह परिचय') };
  return (
    <>
      <PageHead kicker={t('Members helping members', 'सदस्य, सदस्यों के साथ')} title={t('Listings & aid', 'सूचियाँ व सहायता')} />
      <Flash ok={sp.ok} err={sp.err} />
      <section className="card flex flex-col gap-3">
        <h2>{t('Listings waiting for approval', 'स्वीकृति के लिए सूचियाँ')}</h2>
        {(lists ?? []).length === 0 && <Empty>{t('Nothing waiting.', 'कुछ लंबित नहीं।')}</Empty>}
        {(lists ?? []).map((l: any) => (
          <div key={l.id} className="flex flex-wrap items-center gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
            <div className="min-w-0 flex-1"><b>{l.title}</b> <span className="pill">{kind[l.kind]}</span><p className="whitespace-pre-line text-sm">{l.body}</p><p className="text-sm text-muted">{l.chapter?.name} · {l.contact}</p></div>
            <form action={approveListing}><input type="hidden" name="id" value={l.id} /><Submit className="btn btn-sm">{t('Approve', 'स्वीकृत करें')}</Submit></form>
          </div>
        ))}
      </section>
      {c.isAdmin && (
        <>
          <section className="card flex flex-col gap-3">
            <h2>{t('Scholarship applications', 'छात्रवृत्ति आवेदन')}</h2>
            {(apps ?? []).length === 0 && <Empty>{t('Nothing waiting.', 'कुछ लंबित नहीं।')}</Empty>}
            {(apps ?? []).map((a: any) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="min-w-0 flex-1"><b>{a.student_name}</b> <span className="text-sm text-muted">· {a.scholarship?.title}</span><p className="text-sm">{a.institution} · {a.marks}</p><p className="text-sm text-muted">{a.note}</p></div>
                {['approved', 'declined'].map((s) => <form key={s} action={reviewApplication}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={s} /><Submit className={s === 'approved' ? 'btn btn-sm' : 'btn-bad btn btn-sm'}>{s === 'approved' ? t('Approve', 'स्वीकृत करें') : t('Decline', 'अस्वीकार')}</Submit></form>)}
              </div>
            ))}
          </section>
          <form action={createScholarship} className="card flex flex-col gap-3">
            <h2>{t('Add a scholarship', 'छात्रवृत्ति जोड़ें')}</h2>
            <div className="form-grid">
              <Field label={t('Title', 'शीर्षक')}><input name="title" required className="input" /></Field>
              <Field label={t('Amount (₹)', 'राशि (₹)')}><input name="amount" type="number" className="input" /></Field>
              <Field label={t('Last date', 'अंतिम तिथि')}><input name="deadline" type="date" className="input" /></Field>
              <Field label={t('Who can apply', 'कौन आवेदन कर सकता है')}><input name="description" className="input" /></Field>
            </div>
            <div><Submit className="btn-gold">{t('Add', 'जोड़ें')}</Submit></div>
          </form>
        </>
      )}
    </>
  );
}

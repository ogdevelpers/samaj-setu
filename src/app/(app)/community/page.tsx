import Link from 'next/link';
import { requireMember } from '@/lib/ctx';
import { applyScholarship, deleteListing, postListing } from './actions';
import { Avatar, Empty, Flash, PageHead, Field } from '@/components/ui';
import { Submit } from '@/components/submit';
import { BLOOD, fmtDate, inr } from '@/lib/utils';

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ tab?: string; bg?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireMember();
  const { t, lang, sb } = c;
  const tab = ['blood', 'edu', 'biz', 'vivah', 'shubh', 'obit'].includes(sp.tab ?? '') ? sp.tab! : 'blood';
  const tabs: [string, string][] = [['blood', t('Blood donors', 'रक्तदाता')], ['edu', t('Scholarships', 'छात्रवृत्ति')], ['biz', t('Business & jobs', 'व्यापार व रोजगार')], ['vivah', t('Vivah parichay', 'विवाह परिचय')], ['shubh', t('Shubh samachar', 'शुभ समाचार')], ['obit', t('Condolences', 'शोक सूचना')]];

  let body: React.ReactNode = null;
  if (tab === 'blood') {
    let q = sb.from('people').select('id,full_name,blood_group, household:households!inner(status,chapter:chapters(area,district)), person_contacts(phone,visible)').eq('can_donate_blood', true).eq('deceased', false).eq('household.status', 'approved').not('blood_group', 'is', null).limit(100);
    if (sp.bg && BLOOD.includes(sp.bg)) q = q.eq('blood_group', sp.bg);
    const { data } = await q;
    body = (
      <>
        <div className="flex flex-wrap gap-1.5">
          <Link className="chip" aria-pressed={!sp.bg} href="/community?tab=blood">{t('All', 'सभी')}</Link>
          {BLOOD.map((b) => <Link key={b} className="chip" aria-pressed={sp.bg === b} href={`/community?tab=blood&bg=${encodeURIComponent(b)}`}>{b}</Link>)}
        </div>
        {(data ?? []).length === 0 && <Empty>{t('No donors found.', 'कोई रक्तदाता नहीं मिला।')}</Empty>}
        <div className="grid-auto">
          {(data ?? []).map((p: any) => {
            const ct = Array.isArray(p.person_contacts) ? p.person_contacts[0] : p.person_contacts;
            return (
              <div key={p.id} className="card-flat flex items-center gap-3">
                <Avatar name={p.full_name} /><div className="min-w-0 flex-1"><b>{p.full_name}</b><p className="text-sm text-muted">{p.household?.chapter?.area}, {p.household?.chapter?.district}</p>
                  {ct?.phone ? <a href={`tel:${ct.phone}`} className="text-sm font-semibold text-brand underline">{ct.phone}</a> : <span className="text-sm text-muted">{t('Phone hidden', 'फोन छिपा है')}</span>}</div>
                <span className="pill-bad">{p.blood_group}</span>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted">{t('Only people who ticked "Can donate blood" appear here.', 'केवल वही लोग दिखते हैं जिन्होंने "रक्तदान कर सकते हैं" चुना है।')}</p>
      </>
    );
  } else if (tab === 'edu') {
    const [{ data: sch }, { data: mine }] = await Promise.all([
      sb.from('scholarships').select('*').eq('active', true).order('deadline'),
      sb.from('scholarship_applications').select('scholarship_id,student_name,status').eq('applicant_id', c.user.id),
    ]);
    body = (
      <>
        {(sch ?? []).length === 0 && <Empty>{t('No scholarships open now.', 'अभी कोई छात्रवृत्ति खुली नहीं है।')}</Empty>}
        <div className="grid-auto">
          {(sch ?? []).map((s) => (
            <div key={s.id} className="card-flat flex flex-col gap-2">
              <b>{s.title}</b>
              <p className="text-sm text-muted">{s.description}</p>
              <p className="text-sm">{s.amount ? <>{t('Up to', 'अधिकतम')} <b className="tabular-nums">{inr(s.amount)}</b> · </> : null}{s.deadline ? `${t('apply by', 'अंतिम तिथि')} ${fmtDate(s.deadline, lang)}` : ''}</p>
              {(mine ?? []).filter((m) => m.scholarship_id === s.id).map((m, i) => <span key={i} className="pill-good w-fit">{m.student_name}: {m.status}</span>)}
              <details><summary className="btn-sm btn cursor-pointer list-none">{t('Apply', 'आवेदन करें')}</summary>
                <form action={applyScholarship} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="scholarship" value={s.id} />
                  <Field label={t('Student name', 'विद्यार्थी का नाम')}><input name="student" required className="input" /></Field>
                  <Field label={t('School / college', 'विद्यालय / महाविद्यालय')}><input name="institution" className="input" /></Field>
                  <Field label={t('Marks or percentage', 'अंक या प्रतिशत')}><input name="marks" className="input" /></Field>
                  <Field label={t('Anything else', 'कुछ और')}><textarea name="note" rows={2} className="input" /></Field>
                  <Submit className="btn-gold">{t('Submit application', 'आवेदन जमा करें')}</Submit>
                </form></details>
            </div>
          ))}
        </div>
      </>
    );
  } else if (tab === 'biz' || tab === 'vivah') {
    const kinds = tab === 'vivah' ? ['vivah'] : ['business', 'job'];
    const { data } = await sb.from('listings').select('*, chapter:chapters(name)').in('kind', kinds).order('created_at', { ascending: false }).limit(60);
    body = (
      <>
        {tab === 'vivah' && <div className="card-flat text-sm">{t('Opt-in only. Each profile is approved by a coordinator and shown only to verified families. Contact goes through the family head.', 'केवल स्वेच्छा से। हर प्रोफ़ाइल संयोजक द्वारा स्वीकृत होती है और केवल सत्यापित परिवारों को दिखती है। संपर्क परिवार के मुखिया के माध्यम से होता है।')}</div>}
        {(data ?? []).length === 0 && <Empty>{t('Nothing here yet.', 'अभी कुछ नहीं है।')}</Empty>}
        <div className="grid-auto">
          {(data ?? []).map((l: any) => (
            <div key={l.id} className="card-flat flex flex-col gap-1">
              <div className="flex items-center gap-2"><b>{l.title}</b>{l.kind === 'job' && <span className="pill">{t('Job', 'रोजगार')}</span>}{!l.approved && <span className="pill-warn">{t('Waiting for approval', 'स्वीकृति की प्रतीक्षा')}</span>}</div>
              <p className="whitespace-pre-line text-sm">{l.body}</p>
              <p className="text-sm text-muted">{l.chapter?.name}{l.contact ? ` · ${l.contact}` : ''}</p>
              {(l.created_by === c.user.id || c.canPost) && <form action={deleteListing}><input type="hidden" name="id" value={l.id} /><Submit className="btn-bad btn btn-sm">{t('Remove', 'हटाएँ')}</Submit></form>}
            </div>
          ))}
        </div>
        <form action={postListing} className="card flex flex-col gap-2">
          <h2>{tab === 'vivah' ? t('Add a vivah parichay profile', 'विवाह परिचय प्रोफ़ाइल जोड़ें') : t('Add a business or job', 'व्यापार या रोजगार जोड़ें')}</h2>
          {tab === 'vivah' ? <input type="hidden" name="kind" value="vivah" /> : (
            <Field label={t('Type', 'प्रकार')}><select name="kind" className="input"><option value="business">{t('My business', 'मेरा व्यापार')}</option><option value="job">{t('Job opening', 'रोजगार अवसर')}</option></select></Field>
          )}
          <Field label={tab === 'vivah' ? t('Name, age, education', 'नाम, आयु, शिक्षा') : t('Title', 'शीर्षक')}><input name="title" required className="input" /></Field>
          <Field label={t('Details', 'विवरण')}><textarea name="body" rows={3} className="input" /></Field>
          <Field label={t('Contact (name and number)', 'संपर्क (नाम व नंबर)')}><input name="contact" className="input" /></Field>
          <div><Submit className="btn-gold">{t('Send for approval', 'स्वीकृति हेतु भेजें')}</Submit></div>
        </form>
      </>
    );
  } else if (tab === 'shubh') {
    const [{ data: notices }, { data: board }] = await Promise.all([
      sb.from('notices').select('id,title,body,created_at').eq('category', 'shubh').order('created_at', { ascending: false }).limit(20),
      sb.rpc('contribution_board'),
    ]);
    body = (
      <>
        <p className="text-sm text-muted">{t('Contributors choose whether their name and amount appear here.', 'सहयोग देने वाले स्वयं तय करते हैं कि उनका नाम और राशि यहाँ दिखे या नहीं।')}</p>
        {(notices ?? []).length === 0 && <Empty>{t('No shubh samachar yet.', 'अभी कोई शुभ समाचार नहीं।')}</Empty>}
        {(notices ?? []).map((n) => (
          <div key={n.id} className="flex items-start gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-accent-soft text-warn">✦</span>
            <div className="min-w-0 flex-1"><b>{n.title}</b><p className="text-sm">{n.body}</p><p className="text-sm text-muted">{fmtDate(n.created_at, lang)}</p></div>
            <Link href="/payments#occasion" className="btn-alt btn btn-sm">{t('Send blessings', 'आशीर्वाद भेजें')}</Link>
          </div>
        ))}
        {(board ?? []).length > 0 && (
          <div className="card-flat flex flex-col gap-1">
            <h2>{t('Recent contributions', 'हाल के सहयोग')}</h2>
            {(board ?? []).filter((b: any) => b.label).map((b: any, i: number) => (
              <p key={i}><b>{b.label}</b> <span className="text-muted">· {b.occasion}{b.amount ? ` · ${inr(b.amount)}` : ''}</span></p>
            ))}
          </div>
        )}
      </>
    );
  } else {
    const { data } = await sb.from('notices').select('id,title,body,created_at, chapter:chapters(name)').eq('category', 'condolence').order('created_at', { ascending: false }).limit(30);
    body = (
      <>
        {(data ?? []).length === 0 && <Empty>{t('No notices.', 'कोई सूचना नहीं।')}</Empty>}
        {(data ?? []).map((n: any) => (
          <div key={n.id} className="flex items-start gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-soft text-brand">🕯</span>
            <div><b>{n.title}</b><p className="text-sm">{n.body}</p><p className="text-sm text-muted">{n.chapter?.name ?? t('All chapters', 'सभी शाखाएँ')} · {fmtDate(n.created_at, lang)}</p></div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <PageHead kicker={t('Members helping members', 'सदस्य, सदस्यों के साथ')} title={t('Community help', 'समाज सहयोग')} />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="card flex flex-col gap-4">
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
          {tabs.map(([k, v]) => (
            <Link key={k} role="tab" aria-selected={tab === k} href={`/community?tab=${k}`} className={`whitespace-nowrap border-b-[3px] px-3 py-2 font-semibold ${tab === k ? 'border-accent text-ink' : 'border-transparent text-muted'}`}>{v}</Link>
          ))}
        </div>
        {body}
      </div>
    </>
  );
}

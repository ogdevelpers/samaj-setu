import { requireStaff } from '@/lib/ctx';
import { setRole } from '../actions';
import { Flash, PageHead } from '@/components/ui';
import { Submit } from '@/components/submit';

export default async function People({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const c = await requireStaff(['admin']);
  const { t, sb } = c;
  let uq = sb.from('profiles').select('id,email,full_name,role,chapter_id').order('role').order('created_at', { ascending: false }).limit(100);
  const q = (sp.q ?? '').trim().replace(/[%,()]/g, ' ');
  if (q) uq = uq.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  const [{ data: users }, { data: chapters }] = await Promise.all([uq, sb.from('chapters').select('id,name').order('name')]);
  const roleName: Record<string, string> = { member: t('Member', 'सदस्य'), coordinator: t('Coordinator', 'संयोजक'), treasurer: t('Treasurer', 'कोषाध्यक्ष'), admin: t('Admin', 'प्रबंधक') };
  return (
    <>
      <PageHead kicker={t('Give someone a job', 'किसी को जिम्मेदारी दें')} title={t('People & roles', 'लोग व भूमिकाएँ')}
        sub={t('Ask the person to sign up first. Then find them here and choose their role and place. A coordinator approves families. A treasurer confirms payments.', 'पहले व्यक्ति से साइन अप करवाएँ। फिर उन्हें यहाँ खोजकर भूमिका और स्थान चुनें। संयोजक परिवार स्वीकृत करता है। कोषाध्यक्ष भुगतान की पुष्टि करता है।')} />
      <Flash ok={sp.ok} err={sp.err} />
      <form className="flex gap-2"><input name="q" defaultValue={sp.q ?? ''} className="input" placeholder={t('Search name or email', 'नाम या ईमेल खोजें')} aria-label="Search" /><button className="btn">{t('Search', 'खोजें')}</button></form>
      <div className="grid gap-3">
        {(users ?? []).map((u) => (
          <form key={u.id} action={setRole} className="card flex flex-wrap items-center gap-3 !p-3">
            <input type="hidden" name="id" value={u.id} />
            <div className="min-w-0 flex-1 basis-48"><b>{u.full_name || '—'}</b> <span className={u.role === 'member' ? 'pill' : 'pill-good'}>{roleName[u.role]}</span><p className="truncate text-sm text-muted">{u.email}</p></div>
            <select name="role" defaultValue={u.role} className="input !w-40" aria-label="Role">{Object.entries(roleName).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select name="chapter" defaultValue={u.chapter_id ?? ''} className="input !w-48" aria-label="Place"><option value="">{t('— Place —', '— स्थान —')}</option>{(chapters ?? []).map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</select>
            <Submit className="btn-alt btn btn-sm">{t('Save', 'सहेजें')}</Submit>
          </form>
        ))}
      </div>
    </>
  );
}

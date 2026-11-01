import { requireStaff } from '@/lib/ctx';
import { PageHead } from '@/components/ui';

export default async function Activity() {
  const c = await requireStaff(['admin']);
  const { t, lang, sb } = c;
  const { data } = await sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100);
  return (
    <>
      <PageHead kicker={t('Who changed what', 'किसने क्या बदला')} title={t('Activity log', 'गतिविधि')} />
      <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>{t('When', 'कब')}</th><th>{t('What', 'क्या')}</th><th>{t('Detail', 'विवरण')}</th></tr></thead><tbody>
        {(data ?? []).map((a) => <tr key={a.id}><td className="whitespace-nowrap tabular-nums">{new Date(a.created_at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</td><td>{a.action}</td><td className="break-all text-sm text-muted">{a.detail}</td></tr>)}
      </tbody></table></div>
    </>
  );
}

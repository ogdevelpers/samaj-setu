import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireMember } from '@/lib/ctx';
import { PrintButton } from '../../print-button';
import { ORG_EN, ORG_HI, fmtDate, inr } from '@/lib/utils';

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await requireMember();
  const { t, lang } = c;
  const { data: p } = await c.sb.from('payments').select('*, household:households(head_name), chapter:chapters(name)').eq('id', id).eq('status', 'confirmed').maybeSingle();
  if (!p) notFound();
  const rows: [string, string][] = [
    [t('Received from', 'प्राप्त किया'), p.household?.head_name],
    [t('For', 'किसलिए'), p.kind === 'dues' ? `${t('Annual dues', 'वार्षिक शुल्क')} ${p.fy}` : p.kind === 'occasion' ? `${t('Occasion contribution', 'अवसर पर सहयोग')} · ${p.occasion ?? ''}` : t('Donation', 'दान')],
    [t('Chapter', 'शाखा'), p.chapter?.name],
    [t('Mode', 'माध्यम'), String(p.mode).toUpperCase() + (p.utr ? ` · ${p.utr}` : '')],
    [t('Date', 'दिनांक'), fmtDate(p.confirmed_at ?? p.created_at, lang, { day: 'numeric', month: 'long', year: 'numeric' })],
  ];
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="no-print flex gap-2"><Link href="/payments" className="btn-alt btn btn-sm">← {t('Back', 'पीछे')}</Link><PrintButton label={t('Print or save as PDF', 'प्रिंट करें / PDF सहेजें')} /></div>
      <div className="rounded-xl border-2 border-line2 bg-surface p-6">
        <div className="mb-4 text-center">
          <h1 className="!text-2xl">{lang === 'hi' ? ORG_HI : ORG_EN}</h1>
          <p className="lbl mt-1">{t('Receipt', 'रसीद')} · {p.receipt_no}</p>
        </div>
        <table className="w-full"><tbody>
          {rows.map(([k, v]) => <tr key={k} className="border-t border-line"><td className="py-2 text-muted">{k}</td><td className="py-2 text-right font-semibold">{v}</td></tr>)}
          <tr className="border-t-2 border-line2"><td className="py-3 text-lg font-bold">{t('Amount', 'राशि')}</td><td className="py-3 text-right font-display text-2xl">{inr(p.amount)}</td></tr>
        </tbody></table>
        <p className="mt-4 text-center text-sm text-muted">{t('Thank you for your support to the samaj.', 'समाज के प्रति आपके सहयोग के लिए धन्यवाद।')}</p>
      </div>
    </div>
  );
}

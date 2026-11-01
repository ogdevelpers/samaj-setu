import { requireMember } from '@/lib/ctx';
import { Avatar, Empty, PageHead } from '@/components/ui';
import { DirectoryFilters } from '@/components/directory-filters';

type Search = { q?: string; state?: string; district?: string; area?: string };

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const c = await requireMember();
  const { t, lang, sb } = c;
  const { data: chapters } = await sb.from('chapters').select('id,state,district,area').order('state').order('district').order('area');
  const chapterIds = (chapters ?? [])
    .filter((x) => (!sp.state || x.state === sp.state) && (!sp.district || x.district === sp.district) && (!sp.area || x.area === sp.area))
    .map((x) => x.id);

  let query = sb
    .from('people')
    .select('id,full_name,gender,occupation,blood_group,deceased, household:households!inner(id,status,chapter_id,chapter:chapters(state,district,area)), person_contacts(phone,visible)')
    .eq('household.status', 'approved')
    .eq('deceased', false)
    .order('full_name')
    .limit(120);
  if (sp.state || sp.district || sp.area) query = query.in('household.chapter_id', chapterIds.length ? chapterIds : ['00000000-0000-0000-0000-000000000000']);
  const q = (sp.q ?? '').trim().replace(/[%,()]/g, ' ');
  if (q) query = query.or(`full_name.ilike.%${q}%,occupation.ilike.%${q}%`);
  const { data: people } = await query;

  return (
    <>
      <PageHead kicker={t('Members only', 'केवल सदस्यों के लिए')} title={t('Member directory', 'सदस्य निर्देशिका')} sub={t('Browse by place. Phone numbers show only if the family allows it.', 'स्थान के अनुसार खोजें। फोन नंबर तभी दिखते हैं जब परिवार अनुमति दे।')} />
      <DirectoryFilters chapters={chapters ?? []} labels={{ search: t('Search name or profession', 'नाम या व्यवसाय खोजें'), state: t('State', 'राज्य'), district: t('District', 'जिला'), area: t('Area', 'क्षेत्र'), all: t('All', 'सभी'), clear: t('Clear filters', 'फ़िल्टर हटाएँ') }} />
      {(people ?? []).length === 0 && <Empty>{t('No members match these filters.', 'इन फ़िल्टर से कोई सदस्य नहीं मिला।')}</Empty>}
      <div className="grid-auto">
        {(people ?? []).map((p: any) => {
          const contact = Array.isArray(p.person_contacts) ? p.person_contacts[0] : p.person_contacts;
          const ch = p.household?.chapter;
          return (
            <div key={p.id} className="card flex gap-3">
              <Avatar name={p.full_name} female={p.gender === 'F'} />
              <div className="min-w-0">
                <b>{p.full_name}</b>
                <p className="text-sm text-muted">{p.occupation}</p>
                <p className="text-sm text-muted">{ch?.state} › {ch?.district} › {ch?.area}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {p.blood_group && <span className="pill-bad">{p.blood_group}</span>}
                  {contact?.phone ? <a href={`tel:${contact.phone}`} className="text-sm font-semibold text-brand underline">{contact.phone}</a> : <span className="text-sm text-muted">{t('Phone hidden', 'फोन छिपा है')}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {(people ?? []).length === 120 && <p className="text-sm text-muted">{t('Showing the first 120. Narrow your search to see more.', 'पहले 120 दिखाए गए हैं। और देखने के लिए खोज सीमित करें।')}</p>}
    </>
  );
}

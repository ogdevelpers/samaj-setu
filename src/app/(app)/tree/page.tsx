import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/ctx';
import { Empty, PageHead } from '@/components/ui';
import { TreeZoom } from '@/components/tree-zoom';
import { initials } from '@/lib/utils';

type P = { id: string; full_name: string; gender: string | null; dob: string | null; deceased: boolean; father_id: string | null; mother_id: string | null; spouse_id: string | null; household_id: string };
const COLS = 'id,full_name,gender,dob,deceased,father_id,mother_id,spouse_id,household_id';

export default async function TreePage() {
  const c = await requireMember();
  const { t, sb } = c;
  if (!c.household) redirect('/register');

  // Walk up to ancestors, then down to descendants, then add spouses. Capped so a huge tree stays fast.
  const all = new Map<string, P>();
  const add = (rows: P[] | null) => (rows ?? []).forEach((r) => all.set(r.id, r));
  const { data: mine } = await sb.from('people').select(COLS).eq('household_id', c.household.id);
  add(mine as P[]);
  for (let i = 0; i < 6; i++) {
    const need = [...all.values()].flatMap((p) => [p.father_id, p.mother_id]).filter((x): x is string => !!x && !all.has(x));
    if (!need.length) break;
    const { data } = await sb.from('people').select(COLS).in('id', need);
    add(data as P[]);
  }
  for (let i = 0; i < 6; i++) {
    const ids = [...all.keys()];
    const { data } = await sb.from('people').select(COLS).or(`father_id.in.(${ids.join(',')}),mother_id.in.(${ids.join(',')})`).limit(500);
    const before = all.size;
    add(data as P[]);
    if (all.size === before) break;
  }
  const spouseIds = [...all.values()].map((p) => p.spouse_id).filter((x): x is string => !!x && !all.has(x));
  if (spouseIds.length) add((await sb.from('people').select(COLS).in('id', spouseIds)).data as P[]);
  const { data: spouseBack } = await sb.from('people').select(COLS).in('spouse_id', [...all.keys()]);
  add(spouseBack as P[]);

  const people = [...all.values()];
  const spouseOf = (p: P): P | undefined => (p.spouse_id ? all.get(p.spouse_id) : people.find((x) => x.spouse_id === p.id));
  const childrenOf = (p: P) => {
    const sp = spouseOf(p);
    return people.filter((x) => x.father_id === p.id || x.mother_id === p.id || (sp && (x.father_id === sp.id || x.mother_id === sp.id)));
  };
  const hasParentInSet = (p: P) => (p.father_id && all.has(p.father_id)) || (p.mother_id && all.has(p.mother_id));
  const drawn = new Set<string>();
  const mineIds = new Set((mine ?? []).map((m) => m.id));

  // a person married into the tree is drawn beside their spouse, not as a separate root
  const rootCandidates = people.filter((p) => !hasParentInSet(p) && !(spouseOf(p) && hasParentInSet(spouseOf(p)!)));
  // two ancestors who are spouses make one root
  const seen = new Set<string>();
  const roots = rootCandidates.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    const sp = spouseOf(p);
    if (sp) seen.add(sp.id);
    return true;
  });

  const Node = ({ p }: { p: P }) => (
    <span className={`flex w-[150px] items-center gap-2 rounded-xl border bg-surface px-2.5 py-2 text-left ${mineIds.has(p.id) ? 'border-accent ring-2 ring-accent-soft' : 'border-line2'} ${p.deceased ? 'opacity-80' : ''}`}>
      <span className={`grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-bold ${p.gender === 'F' ? 'bg-accent-soft text-warn' : 'bg-brand-soft text-brand'}`}>{initials(p.full_name)}</span>
      <span className="min-w-0"><b className="block truncate text-[0.84rem] leading-tight">{p.full_name}</b><small className="text-muted">{p.dob ? `b. ${p.dob.slice(0, 4)}` : ''}{p.deceased ? ' ✝' : ''}</small></span>
    </span>
  );
  const Branch = ({ p, depth }: { p: P; depth: number }): React.ReactNode => {
    if (drawn.has(p.id) || depth > 12) return null;
    const sp = spouseOf(p);
    drawn.add(p.id);
    if (sp) drawn.add(sp.id);
    const kids = childrenOf(p).filter((k) => !drawn.has(k.id));
    return (
      <li>
        <span className="inline-flex items-center">
          <Node p={p} />
          {sp && (<><span className="h-px w-3.5 bg-accent" /><Node p={sp} /></>)}
        </span>
        {kids.length > 0 && <ul>{kids.map((k) => <Branch key={k.id} p={k} depth={depth + 1} />)}</ul>}
      </li>
    );
  };

  return (
    <>
      <PageHead kicker="वंश वृक्ष" title={t('Family tree', 'वंश वृक्ष')} sub={t('Drawn from the parent and spouse links in each household. Your family is outlined in gold.', 'हर परिवार के माता-पिता और जीवनसाथी के संबंधों से बना है। आपका परिवार सुनहरी रेखा से दिखाया गया है।')}>
        <Link href="/family" className="btn-alt btn btn-sm">{t('Fix links', 'संबंध सुधारें')}</Link>
      </PageHead>
      {people.length <= 1 ? (
        <Empty>{t('Add your spouse, children and parents in My family to grow the tree.', 'वृक्ष बढ़ाने के लिए मेरा परिवार में जीवनसाथी, बच्चे और माता-पिता जोड़ें।')}</Empty>
      ) : (
        <div className="card">
          <TreeZoom labels={{ in: t('Zoom in', 'बड़ा करें'), out: t('Zoom out', 'छोटा करें'), reset: t('Reset', 'रीसेट') }}>
            {roots.map((r) => (
              <div key={r.id} className="tree"><ul><Branch p={r} depth={0} /></ul></div>
            ))}
          </TreeZoom>
        </div>
      )}
    </>
  );
}

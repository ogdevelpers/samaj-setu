'use client';
import { useMemo, useState } from 'react';

type Ch = { id: string; name: string; state: string; district: string; area: string };
type Labels = { state: string; district: string; area: string; choose: string; notListed: string; backToList: string; typeHelp: string };

/** Pick a place from the list, or just type it. Never blocks registration. */
export function PlacePicker({ chapters, labels }: { chapters: Ch[]; labels: Labels }) {
  const [typed, setTyped] = useState(chapters.length === 0);
  const states = useMemo(() => [...new Set(chapters.map((c) => c.state))], [chapters]);
  const [state, setState] = useState(states.length === 1 ? states[0] : '');
  const districts = useMemo(() => [...new Set(chapters.filter((c) => c.state === state).map((c) => c.district))], [chapters, state]);
  const [district, setDistrict] = useState('');
  const d = districts.length === 1 ? districts[0] : district;
  const areas = chapters.filter((c) => c.state === state && c.district === d);
  const [chapter, setChapter] = useState('');
  const chosen = areas.length === 1 ? areas[0].id : chapter;

  if (typed) {
    return (
      <div className="flex flex-col gap-2 sm:col-span-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="field"><label htmlFor="pt-state">{labels.state}</label><input id="pt-state" name="place_state" className="input" placeholder="Rajasthan" /></div>
          <div className="field"><label htmlFor="pt-district">{labels.district}</label><input id="pt-district" name="place_district" className="input" placeholder="Jaipur" /></div>
          <div className="field"><label htmlFor="pt-area">{labels.area}</label><input id="pt-area" name="place_area" required className="input" placeholder="Sanganer" /></div>
        </div>
        <p className="text-sm text-muted">{labels.typeHelp}</p>
        {chapters.length > 0 && <button type="button" className="w-fit text-sm font-semibold text-brand underline" onClick={() => setTyped(false)}>{labels.backToList}</button>}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="field"><label htmlFor="pp-state">{labels.state}</label>
          <select id="pp-state" className="input" value={state} onChange={(e) => { setState(e.target.value); setDistrict(''); setChapter(''); }} required>
            <option value="" disabled>{labels.choose}</option>{states.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="field"><label htmlFor="pp-district">{labels.district}</label>
          <select id="pp-district" className="input" value={d} disabled={!state} onChange={(e) => { setDistrict(e.target.value); setChapter(''); }} required>
            <option value="" disabled>{labels.choose}</option>{districts.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="field"><label htmlFor="pp-area">{labels.area}</label>
          <select id="pp-area" className="input" value={chosen} disabled={!d} onChange={(e) => setChapter(e.target.value)} required>
            <option value="" disabled>{labels.choose}</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.area}</option>)}</select></div>
        <input type="hidden" name="chapter" value={chosen} />
      </div>
      <button type="button" className="w-fit text-sm font-semibold text-brand underline" onClick={() => setTyped(true)}>{labels.notListed}</button>
    </div>
  );
}

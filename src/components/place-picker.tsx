'use client';
import { useMemo, useState } from 'react';

type Ch = { id: string; name: string; state: string; district: string; area: string };

/** State, then district, then area. The last choice is the chapter. */
export function PlacePicker({ chapters, labels }: { chapters: Ch[]; labels: { state: string; district: string; area: string; choose: string } }) {
  const states = useMemo(() => [...new Set(chapters.map((c) => c.state))], [chapters]);
  const [state, setState] = useState(states.length === 1 ? states[0] : '');
  const districts = useMemo(() => [...new Set(chapters.filter((c) => c.state === state).map((c) => c.district))], [chapters, state]);
  const [district, setDistrict] = useState('');
  const d = districts.length === 1 ? districts[0] : district;
  const areas = chapters.filter((c) => c.state === state && c.district === d);
  const [chapter, setChapter] = useState('');
  const chosen = areas.length === 1 ? areas[0].id : chapter;

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:col-span-2">
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
  );
}

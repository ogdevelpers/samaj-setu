export const ORG_EN = 'Shri Dasha Vaishnav Porwad Samaj';
export const ORG_HI = 'श्री दशा वैष्णव पोरवाड़ समाज';

export const inr = (n: number | string | null | undefined) =>
  '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export type Lang = 'hi' | 'en';
const loc = (l: Lang) => (l === 'hi' ? 'hi-IN' : 'en-IN');

export const fmtDate = (d: string | Date | null | undefined, l: Lang, opts?: Intl.DateTimeFormatOptions) =>
  d ? new Date(d).toLocaleDateString(loc(l), opts ?? { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const fmtDateTime = (d: string | Date, l: Lang) =>
  new Date(d).toLocaleString(loc(l), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const monthName = (m: number, l: Lang) => new Date(2000, m, 1).toLocaleDateString(loc(l), { month: 'long' });

/** Financial year runs April to March, e.g. "2026-27". */
export function currentFy(d = new Date()) {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const OCCASIONS: { key: string; en: string; hi: string; amount: number }[] = [
  { key: 'Marriage', en: 'Marriage', hi: 'विवाह', amount: 1100 },
  { key: 'Baby born', en: 'Baby born', hi: 'जन्म', amount: 501 },
  { key: 'Moksh', en: 'Moksh / antim sanskar', hi: 'मोक्ष / अंतिम संस्कार', amount: 1100 },
  { key: 'Griha pravesh', en: 'Griha pravesh', hi: 'गृह प्रवेश', amount: 501 },
  { key: 'Success', en: 'Education or job success', hi: 'शिक्षा / नौकरी में सफलता', amount: 501 },
  { key: 'Other', en: 'Other', hi: 'अन्य', amount: 501 },
];

export const FUNDS = [
  { key: 'general', en: 'Samaj general fund', hi: 'समाज सामान्य कोष' },
  { key: 'scholarship', en: 'Scholarship fund', hi: 'छात्रवृत्ति कोष' },
  { key: 'bhawan', en: 'Samaj Bhawan fund', hi: 'समाज भवन कोष' },
  { key: 'chapter', en: 'My local chapter', hi: 'मेरी स्थानीय शाखा' },
];

export const str = (v: FormDataEntryValue | null | undefined) => (typeof v === 'string' ? v.trim() : '');
export const strOrNull = (v: FormDataEntryValue | null | undefined) => str(v) || null;

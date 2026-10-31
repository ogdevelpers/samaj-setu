import { cookies } from 'next/headers';
import type { Lang } from './utils';

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get('lang')?.value;
  return c === 'en' ? 'en' : 'hi';
}

/** t(english, hindi) returns whichever the member has chosen. Hindi is the default. */
export async function getT() {
  const lang = await getLang();
  const t = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  return { lang, t };
}

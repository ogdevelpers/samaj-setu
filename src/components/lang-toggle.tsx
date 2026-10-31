import { setLang } from '@/app/actions';
import { getLang } from '@/lib/i18n';

export async function LangToggle({ next = '/' }: { next?: string }) {
  const lang = await getLang();
  return (
    <form action={setLang}>
      <input type="hidden" name="lang" value={lang === 'hi' ? 'en' : 'hi'} />
      <input type="hidden" name="next" value={next} />
      <button className="rounded-lg border border-line2 bg-surface px-3 py-1.5 text-sm font-semibold" aria-label="Change language">
        {lang === 'hi' ? 'English' : 'हिन्दी'}
      </button>
    </form>
  );
}

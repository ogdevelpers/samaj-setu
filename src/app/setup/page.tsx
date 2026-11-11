import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { installDatabase } from './actions';
import { createClient } from '@/lib/supabase/server';
import { getSetupState } from '@/lib/setup';
import { getT } from '@/lib/i18n';
import { Flash } from '@/components/ui';
import { Submit } from '@/components/submit';
import { CopyButton } from '@/components/copy-button';
import { LangToggle } from '@/components/lang-toggle';
import { Icon } from '@/components/icon';

const read = (f: string) => { try { return fs.readFileSync(path.join(process.cwd(), 'supabase', f), 'utf8'); } catch { return ''; } };

function Step({ n, done, title, children }: { n: number; done: boolean; title: string; children?: React.ReactNode }) {
  return (
    <section className="card flex gap-4">
      <span className={`grid h-10 w-10 flex-none place-items-center rounded-full font-bold ${done ? 'bg-good text-white' : 'bg-accent text-accent-ink'}`}>{done ? <Icon name="check" /> : n}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-3"><h2>{title}</h2>{children}</div>
    </section>
  );
}

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const { t } = await getT();
  const sb = await createClient();
  const state = await getSetupState(sb);
  const hasUrl = !!process.env.DATABASE_URL;
  const needCode = !!process.env.ADMIN_SETUP_CODE;
  const fullSql = state === 'no_schema' ? read('schema.sql') : ["updates/002_admin_setup.sql", "updates/003_simple_registration.sql", "updates/004_profile_repair.sql"].map(read).join('\n');
  const dbReady = state === 'no_admin' || state === 'ready';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-8">
      <Flash ok={sp.ok} err={sp.err} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="!text-2xl">{t('Set up your portal', 'अपना पोर्टल सेट करें')}</h1>
        <LangToggle next="/setup" />
      </div>
      <p className="text-muted">{t('Three short steps, done once. Each step turns green when it is finished.', 'तीन छोटे चरण, केवल एक बार। हर चरण पूरा होने पर हरा हो जाता है।')}</p>

      <Step n={1} done={state !== 'no_env'} title={t('Connect the database', 'डेटाबेस जोड़ें')}>
        {state === 'no_env' ? (
          <ol className="list-decimal space-y-1 pl-5">
            <li>{t('Create a free project at supabase.com.', 'supabase.com पर मुफ़्त प्रोजेक्ट बनाएँ।')}</li>
            <li>{t('In Vercel open your project → Settings → Environment Variables.', 'Vercel में अपना प्रोजेक्ट → Settings → Environment Variables खोलें।')}</li>
            <li>{t('Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase → Project Settings → API).', 'NEXT_PUBLIC_SUPABASE_URL और NEXT_PUBLIC_SUPABASE_ANON_KEY जोड़ें (Supabase → Project Settings → API)।')}</li>
            <li>{t('Redeploy, then refresh this page.', 'फिर से Deploy करें, फिर यह पेज रीफ़्रेश करें।')}</li>
          </ol>
        ) : <p className="text-good">{t('Connected.', 'जुड़ गया।')}</p>}
      </Step>

      <Step n={2} done={dbReady} title={t('Install the database', 'डेटाबेस तैयार करें')}>
        {state === 'no_env' && <p className="text-muted">{t('Finish step 1 first.', 'पहले चरण 1 पूरा करें।')}</p>}
        {dbReady && <p className="text-good">{t('The database is ready.', 'डेटाबेस तैयार है।')}</p>}
        {(state === 'no_schema' || state === 'needs_update') && (
          <>
            <p>{state === 'no_schema' ? t('The database is empty. Install it with one button.', 'डेटाबेस खाली है। एक बटन से इसे तैयार करें।') : t('The database needs a small update. Update it with one button.', 'डेटाबेस को छोटे अपडेट की ज़रूरत है। एक बटन से अपडेट करें।')}</p>
            {hasUrl ? (
              <form action={installDatabase} className="flex flex-wrap items-end gap-3">
                {needCode && <div className="field"><label htmlFor="code">{t('Setup code', 'सेटअप कोड')}</label><input id="code" name="code" required className="input" /></div>}
                <Submit className="btn-gold" pendingText={t('Installing…', 'तैयार हो रहा है…')}>{state === 'no_schema' ? t('Install database', 'डेटाबेस तैयार करें') : t('Update database', 'डेटाबेस अपडेट करें')}</Submit>
              </form>
            ) : (
              <div className="rounded-xl bg-warn-soft p-3 text-warn">
                <b>{t('One more value is needed for the button:', 'बटन के लिए एक और मान चाहिए:')}</b>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink">
                  <li>{t('Supabase → click the green Connect button at the top → copy the "Transaction pooler" connection string.', 'Supabase → ऊपर हरे Connect बटन पर क्लिक करें → "Transaction pooler" कनेक्शन स्ट्रिंग कॉपी करें।')}</li>
                  <li>{t('Replace [YOUR-PASSWORD] in it with your database password.', 'उसमें [YOUR-PASSWORD] की जगह अपना डेटाबेस पासवर्ड लिखें।')}</li>
                  <li>{t('In Vercel add it as DATABASE_URL, redeploy, and refresh this page.', 'Vercel में इसे DATABASE_URL नाम से जोड़ें, फिर Deploy करें और यह पेज रीफ़्रेश करें।')}</li>
                </ol>
              </div>
            )}
            <details className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer font-semibold text-brand">{t('Prefer to do it by copy and paste?', 'कॉपी-पेस्ट से करना चाहते हैं?')}</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>{t('Copy the text below.', 'नीचे का टेक्स्ट कॉपी करें।')} <CopyButton text={fullSql} label={t('Copy', 'कॉपी करें')} doneLabel={t('Copied', 'कॉपी हुआ')} /></li>
                <li>{t('Supabase → SQL Editor → New query → paste → Run.', 'Supabase → SQL Editor → New query → पेस्ट करें → Run।')}</li>
                <li>{t('Refresh this page.', 'यह पेज रीफ़्रेश करें।')}</li>
              </ol>
            </details>
          </>
        )}
      </Step>

      <Step n={3} done={state === 'ready'} title={t('Create the admin account', 'प्रबंधक खाता बनाएँ')}>
        {state === 'ready' && <><p className="text-good">{t('An admin exists. All set.', 'प्रबंधक बन चुका है। सब तैयार है।')}</p><div className="flex gap-2"><Link href="/admin/login" className="btn">{t('Admin sign-in', 'प्रबंधक साइन इन')}</Link><Link href="/login" className="btn-alt btn">{t('Member sign-in', 'सदस्य साइन इन')}</Link></div></>}
        {state === 'no_admin' && (<><p>{t('You will be the admin. You choose an email and password. Members never use this page.', 'आप प्रबंधक होंगे। आप अपना ईमेल और पासवर्ड चुनेंगे। सदस्य इस पेज का उपयोग नहीं करते।')}</p><div><Link href="/admin/setup" className="btn-gold btn">{t('Create admin account', 'प्रबंधक खाता बनाएँ')}</Link></div></>)}
        {state !== 'no_admin' && state !== 'ready' && <p className="text-muted">{t('Finish step 2 first.', 'पहले चरण 2 पूरा करें।')}</p>}
      </Step>
    </main>
  );
}

'use server';
import fs from 'node:fs';
import path from 'node:path';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import { createClient } from '@/lib/supabase/server';
import { getSetupState } from '@/lib/setup';
import { str } from '@/lib/utils';

const back = (m: string, k: 'ok' | 'err' = 'err') => redirect(`/setup?${k}=${encodeURIComponent(m)}`);
const sql = (f: string) => fs.readFileSync(path.join(process.cwd(), 'supabase', f), 'utf8');

/** Installs or updates the database from the app itself. Only allowed until the first admin exists. */
export async function installDatabase(fd: FormData) {
  const url = process.env.DATABASE_URL;
  if (!url) back('DATABASE_URL is not set in Vercel yet. Follow the steps shown, or use the copy-and-paste option.');
  const need = process.env.ADMIN_SETUP_CODE;
  if (need && str(fd.get('code')) !== need) back('The setup code is wrong.');

  const sb = await createClient();
  const state = await getSetupState(sb);
  if (state === 'ready') back('The portal is already set up and has an admin.');
  if (state === 'no_admin') back('The database is already installed. Go to step 3.');
  if (state === 'no_env') back('Connect Supabase first (step 1).');

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  let failure = '';
  try {
    await client.connect();
    // never touch a database that already has an admin
    const t = await client.query(`select to_regclass('public.profiles') as p`);
    if (t.rows[0].p) {
      const a = await client.query(`select 1 from public.profiles where role = 'admin' limit 1`);
      if (a.rowCount) failure = 'An admin already exists, so the installer is locked.';
    }
    if (!failure) {
      await client.query('begin');
      if (state === 'no_schema') await client.query(sql('schema.sql'));
      else await client.query(sql('fix-everything.sql'));
      await client.query('commit');
      await client.query(`notify pgrst, 'reload schema'`);
    }
  } catch (e) {
    try { await client.query('rollback'); } catch {}
    failure = `Could not install: ${(e as Error).message}`;
  }
  await client.end().catch(() => {});
  if (failure) back(failure);
  back('Database is ready.', 'ok');
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentFy } from '@/lib/utils';

const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export async function GET(request: Request) {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return new NextResponse('Unauthorized', { status: 401 });
  const { data: me } = await sb.from('profiles').select('role').eq('id', u.user.id).single();
  if (!me || !['admin', 'treasurer'].includes(me.role)) return new NextResponse('Forbidden', { status: 403 });
  const fy = new URL(request.url).searchParams.get('fy') || currentFy();
  const y = Number(fy.slice(0, 4));
  const [{ data: pays }, { data: exps }] = await Promise.all([
    sb.from('payments').select('receipt_no,confirmed_at,kind,occasion,fund,amount,mode,utr,household:households(head_name),chapter:chapters(name)').eq('fy', fy).eq('status', 'confirmed').order('confirmed_at'),
    sb.from('expenses').select('spent_on,description,category,amount,chapter:chapters(name)').gte('spent_on', `${y}-04-01`).lt('spent_on', `${y + 1}-04-01`).order('spent_on'),
  ]);
  const lines = ['Type,Date,Receipt,Chapter,Family/Description,Category,Mode,Reference,Amount'];
  (pays ?? []).forEach((p: any) => lines.push(['Income', p.confirmed_at?.slice(0, 10), p.receipt_no, p.chapter?.name, p.household?.head_name, p.kind + (p.occasion ? ` (${p.occasion})` : ''), p.mode, p.utr, p.amount].map(esc).join(',')));
  (exps ?? []).forEach((e: any) => lines.push(['Expense', e.spent_on, '', e.chapter?.name, e.description, e.category, '', '', -e.amount].map(esc).join(',')));
  return new NextResponse('﻿' + lines.join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="samaj-ledger-${fy}.csv"` },
  });
}

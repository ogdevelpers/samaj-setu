import { LangToggle } from './lang-toggle';
import { ORG_HI } from '@/lib/utils';

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand font-display text-base text-brand-ink">श्री</span>
          <span className="font-display text-xl leading-tight">{ORG_HI}</span>
        </div>
        <LangToggle next="/login" />
      </div>
      <div className="card flex flex-col gap-4">
        <h1 className="!text-2xl">{title}</h1>
        {children}
      </div>
    </main>
  );
}

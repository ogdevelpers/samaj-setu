'use client';
import { useOptimistic, useTransition } from 'react';

/** Responds instantly, then saves in the background. */
export function RsvpButton({ eventId, going, action, labels }: { eventId: string; going: boolean; action: (fd: FormData) => Promise<void>; labels: { on: string; off: string } }) {
  const [opt, setOpt] = useOptimistic(going, (_s, v: boolean) => v);
  const [, start] = useTransition();
  return (
    <button className={opt ? 'btn-alt btn btn-sm' : 'btn btn-sm'} aria-pressed={opt}
      onClick={() => start(async () => { setOpt(!opt); const fd = new FormData(); fd.set('id', eventId); await action(fd); })}>
      {opt ? labels.on : labels.off}
    </button>
  );
}

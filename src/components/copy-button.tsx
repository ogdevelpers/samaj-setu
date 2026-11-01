'use client';
import { useState } from 'react';
import { Icon } from './icon';

export function CopyButton({ text, label, doneLabel }: { text: string; label: string; doneLabel: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn-alt btn btn-sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); } catch {}
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    }}>
      <Icon name={done ? 'check' : 'copy'} className="h-4 w-4" />{done ? doneLabel : label}
    </button>
  );
}

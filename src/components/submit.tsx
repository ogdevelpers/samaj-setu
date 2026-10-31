'use client';
import { useFormStatus } from 'react-dom';

export function Submit({ children, className = 'btn', pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (pendingText ?? '…') : children}
    </button>
  );
}

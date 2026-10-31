'use client';
export function PrintButton({ label }: { label: string }) {
  return <button onClick={() => window.print()} className="btn no-print">{label}</button>;
}

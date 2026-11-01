'use client';
import { useState } from 'react';
import { Icon } from './icon';

export function TreeZoom({ children, labels }: { children: React.ReactNode; labels: { in: string; out: string; reset: string } }) {
  const [z, setZ] = useState(1);
  return (
    <div>
      <div className="no-print mb-2 flex items-center gap-2">
        <button className="btn-alt btn btn-sm" onClick={() => setZ((v) => Math.max(0.5, +(v - 0.15).toFixed(2)))} aria-label={labels.out}><Icon name="zoomout" className="h-4 w-4" /></button>
        <span className="w-12 text-center text-sm tabular-nums text-muted">{Math.round(z * 100)}%</span>
        <button className="btn-alt btn btn-sm" onClick={() => setZ((v) => Math.min(1.6, +(v + 0.15).toFixed(2)))} aria-label={labels.in}><Icon name="zoomin" className="h-4 w-4" /></button>
        <button className="btn-alt btn btn-sm" onClick={() => setZ(1)}>{labels.reset}</button>
      </div>
      <div style={{ zoom: z }}>{children}</div>
    </div>
  );
}

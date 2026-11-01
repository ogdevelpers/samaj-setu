const PATHS: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  cal: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  img: 'M3 4h18v16H3zM9 10a2 2 0 100-4 2 2 0 000 4zM21 16l-5-5-8 8',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-4 3-6 7-6s7 2 7 6M17 5a3.5 3.5 0 010 7M22 20c0-3-2-5-5-5.5',
  family: 'M12 12a3 3 0 100-6 3 3 0 000 6zM5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2',
  tree: 'M12 7.5V12M5 16.5V12h14v4.5M9.5 5a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M2.5 19a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M16.5 19a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0',
  rupee: 'M7 5h11M7 10h11M7 5c6 0 6 9-1 9l8 6',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z',
  book: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  check: 'M5 13l4 4L19 7',
  map: 'M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  bell: 'M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 004 0',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8l-1 3 2 1v2l-2 1 1 3 2-.5L7.5 19l-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  plus: 'M12 5v14M5 12h14',
  out: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  zoomin: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5M11 8v6M8 11h6',
  zoomout: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5M8 11h6',
};

export function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} flex-none`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name] ?? PATHS.home} />
    </svg>
  );
}

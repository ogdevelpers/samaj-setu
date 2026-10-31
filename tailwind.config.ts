import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', surface2: 'var(--surface2)', ink: 'var(--ink)', muted: 'var(--muted)',
        line: 'var(--line)', line2: 'var(--line2)', brand: 'var(--brand)', 'brand-ink': 'var(--brand-ink)', 'brand-soft': 'var(--brand-soft)',
        accent: 'var(--accent)', 'accent-ink': 'var(--accent-ink)', 'accent-soft': 'var(--accent-soft)',
        good: 'var(--good)', 'good-soft': 'var(--good-soft)', warn: 'var(--warn)', 'warn-soft': 'var(--warn-soft)', bad: 'var(--bad)', 'bad-soft': 'var(--bad-soft)',
      },
      fontFamily: { display: ['var(--font-display)', 'Georgia', 'serif'], body: ['var(--font-body)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;

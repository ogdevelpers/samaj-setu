import type { Metadata, Viewport } from 'next';
import { Mukta, Rozha_One } from 'next/font/google';
import { getLang } from '@/lib/i18n';
import './globals.css';

const body = Mukta({ subsets: ['latin', 'devanagari'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
const display = Rozha_One({ subsets: ['latin', 'devanagari'], weight: '400', variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'श्री दशा वैष्णव पोरवाड़ समाज',
  description: 'Shri Dasha Vaishnav Porwad Samaj: members, families, events, gallery and dues.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#0d4a50', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body className={`${body.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}

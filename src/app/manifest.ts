import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'श्री दशा वैष्णव पोरवाड़ समाज',
    short_name: 'समाज',
    start_url: '/',
    display: 'standalone',
    background_color: '#eef3f3',
    theme_color: '#0d4a50',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}

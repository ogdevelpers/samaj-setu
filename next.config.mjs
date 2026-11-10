/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
  serverExternalPackages: ['pg'],
  // the one-click database installer on /setup reads these files at run time
  outputFileTracingIncludes: { '/setup': ['./supabase/**/*'] },
};
export default nextConfig;

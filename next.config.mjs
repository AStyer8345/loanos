/** @type {import('next').NextConfig} */

// Content Security Policy — blocks third-party script injection, inline
// event handlers with arbitrary src, mixed content, and clickjacking.
//
// Notes on directives:
// - script-src needs 'unsafe-inline' + 'unsafe-eval' because Next.js 14
//   App Router ships inline scripts without nonces by default. A future
//   nonce rollout (via middleware) would let us drop both.
// - connect-src must allow Supabase (https + wss for realtime auth),
//   Vercel analytics, and Vercel Live overlay for preview deployments.
//   Most third-party APIs (Anthropic, n8n, Publer) are called
//   server-side and don't need CSP allowances. Exception:
//   styermortgage.com — NewsletterForm posts directly to its Netlify
//   function from the client. Long-term this should be proxied through
//   a LoanOS API route; for now, allow the origin.
// - frame-src allows Calendly for the share-page embed.
// - frame-ancestors 'self' blocks clickjacking but still allows our own
//   share pages to render LO-branded iframes internally if needed.
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://vitals.vercel-insights.com https://*.vercel-insights.com https://styermortgage.com",
  "frame-src 'self' https://calendly.com https://*.calendly.com https://vercel.live",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  // Ensure the /admin/ops route ships its raw HTML content file (read via
  // fs.readFileSync at module load) with the serverless function bundle.
  // Without this, Vercel's file tracer wouldn't pick it up.
  outputFileTracingIncludes: {
    '/admin/ops': ['./src/app/admin/ops/ops-content.html'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

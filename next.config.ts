import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Beveiligingsheaders. De CSP wordt afgedwongen (sinds 2026-10-22, nadat een
// echte browser alle belangrijke pagina's zonder overtreding doorliep).
// Overtredingen worden nog steeds gemeld aan /api/csp-report. Gaat er na een
// wijziging iets stuk, zet dan tijdelijk de sleutel hieronder terug op
// "Content-Security-Policy-Report-Only".
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://eu-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.algolia.net https://*.algolianet.com https://*.mux.com https://storage.googleapis.com",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://appleid.apple.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
  "report-uri /api/csp-report",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The separate Discover feed is gone: the algorithm serves one feed.
  async redirects() {
    return [{ source: "/app/discover", destination: "/app", permanent: false }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      { protocol: "https", hostname: "image.mux.com" },
      // Profile photos and ad videos' poster images live in Supabase Storage.
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname }]
        : []),
    ],
  },
};

// No SENTRY_AUTH_TOKEN yet — source maps just won't upload (build still
// succeeds, only readable stack traces in Sentry are affected). Add one
// from Sentry's Settings > Auth Tokens to enable that later.
export default withSentryConfig(nextConfig, {
  org: "swyp",
  project: "javascript-nextjs",
  silent: true,
});

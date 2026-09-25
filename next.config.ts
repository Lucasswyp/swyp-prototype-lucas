import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
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

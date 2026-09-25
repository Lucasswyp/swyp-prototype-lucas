import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // A modest sample rate — enough to catch real performance regressions
  // without burning through the free-tier event quota on every pageview.
  tracesSampleRate: 0.2,
  enabled: process.env.NODE_ENV === "production",
});

"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// src/app/error.tsx only catches errors inside the root layout's children —
// a crash in the root layout itself (or anywhere above that boundary) was
// falling through to Next.js's bare, unstyled default error screen. This is
// the one Next.js renders instead in that case, and it has to define its
// own <html>/<body> since the root layout is exactly what failed.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <html lang="nl">
      <body className="min-h-screen bg-indigo text-white flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-xl font-bold mb-2">Er ging iets mis</h1>
        <p className="text-white/50 text-sm mb-8 max-w-xs">
          Swyp kon niet goed laden. Probeer het opnieuw.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-white text-indigo font-semibold text-sm px-5 py-3"
        >
          Probeer opnieuw
        </button>
      </body>
    </html>
  );
}

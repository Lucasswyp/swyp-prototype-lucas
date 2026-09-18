"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-center px-6">
      <Logo size="lg" className="mb-6" />
      <h1 className="font-heading text-xl font-bold mb-2">Er ging iets mis</h1>
      <p className="text-white/50 text-sm mb-8 max-w-xs">
        Probeer het opnieuw. Als dit blijft gebeuren, reset dan de demo via je profiel.
      </p>
      <Button onClick={() => reset()}>Probeer opnieuw</Button>
    </div>
  );
}

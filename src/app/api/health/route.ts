import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gezondheidscheck voor bewaking: bereikbaar zonder inloggen en geeft geen
// gegevens terug. Controleert of de site draait én of de database antwoordt
// (met de publieke sleutel, via de openbare view public_businesses).
export async function GET() {
  const started = Date.now();
  let db = false;
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { error } = await Promise.race([
      supabase.from("public_businesses").select("id", { head: true, count: "exact" }).limit(1),
      new Promise<{ error: Error }>((resolve) => setTimeout(() => resolve({ error: new Error("timeout") }), 5000)),
    ]);
    db = !error;
  } catch {
    db = false;
  }
  return NextResponse.json(
    { ok: db, db, ms: Date.now() - started },
    { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}

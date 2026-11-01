import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { Category } from "@/types";
import { BUSINESS_TERMS_VERSION } from "@/lib/businessTerms";

export async function POST(request: Request) {
  // Unauthenticated by design (there's no account yet) — the one endpoint
  // in this app an attacker could actually script mass-signups against.
  const allowed = await checkRateLimit(`signup-business:${getClientIp(request)}`, 5, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een uur opnieuw." }, { status: 429 });
  }

  const { email, password, companyName, category, location, acceptedTerms } = await request.json();

  if (!email || !password || !companyName) {
    return NextResponse.json({ error: "Vul alle velden in." }, { status: 400 });
  }

  // Zonder akkoord op de voorwaarden voor bedrijven geen account. Het akkoord
  // wordt met versie en tijdstip bij het account bewaard.
  if (acceptedTerms !== true) {
    return NextResponse.json({ error: "Ga akkoord met de voorwaarden voor bedrijven om door te gaan." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { business_terms_version: BUSINESS_TERMS_VERSION, business_terms_accepted_at: new Date().toISOString() },
  });

  if (createError) {
    const message = createError.message.includes("already been registered")
      ? "Er bestaat al een account met dit e-mailadres."
      : createError.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const defaultLogo =
    "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=200&q=80&auto=format&fit=crop";
  const defaultBanner =
    "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=1200&q=80&auto=format&fit=crop";

  const { error: insertError } = await admin.from("businesses").insert({
    auth_user_id: created.user.id,
    name: companyName,
    category: (category as Category) || "Fashion",
    location: location || "Nederland",
    website: "",
    description: "",
    logo_url: defaultLogo,
    banner_url: defaultBanner,
    verified: false,
    followers: 0,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Aanmaken van je bedrijfsprofiel is mislukt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

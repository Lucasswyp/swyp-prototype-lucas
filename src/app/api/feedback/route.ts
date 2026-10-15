import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const KINDS = ["bug", "idee", "overig"];

export async function POST(request: Request) {
  const allowed = await checkRateLimit(`feedback:${getClientIp(request)}`, 10, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel berichten. Probeer het later opnieuw." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const kind = KINDS.includes(body.kind) ? body.kind : "overig";
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : null;

  if (message.length < 3 || message.length > 2000) {
    return NextResponse.json({ error: "Schrijf een bericht van 3 tot 2000 tekens." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await createAdminClient()
    .from("feedback")
    .insert({
      user_id: userData.user?.id ?? null,
      kind,
      message,
      page,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
  if (error) {
    return NextResponse.json({ error: "Versturen is mislukt. Probeer het later opnieuw." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

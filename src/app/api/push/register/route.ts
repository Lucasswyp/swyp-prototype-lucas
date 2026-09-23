import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { token } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const { data: consumer } = await supabase
    .from("consumers")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  if (!consumer) {
    return NextResponse.json({ error: "Not a consumer." }, { status: 403 });
  }

  const { error } = await supabase
    .from("push_tokens")
    .upsert({ consumer_id: consumer.id, token, platform: "ios" }, { onConflict: "consumer_id,token" });
  if (error) {
    return NextResponse.json({ error: "Opslaan is mislukt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Vul alle velden in." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    const message = createError.message.includes("already been registered")
      ? "Er bestaat al een account met dit e-mailadres."
      : createError.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: insertError } = await admin.from("consumers").insert({
    auth_user_id: created.user.id,
    name,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Aanmaken van je profiel is mislukt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Removes the signed-in user's account and everything tied to it. Database
// rows cascade from auth.users; storage files do not, so they are removed here.
export async function POST(request: Request) {
  const allowed = await checkRateLimit(`delete-account:${getClientIp(request)}`, 5, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het later opnieuw." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { confirm } = await request.json().catch(() => ({ confirm: "" }));
  if (confirm !== "VERWIJDER") {
    return NextResponse.json({ error: "Bevestiging ontbreekt." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (business) {
    await removeFolder(admin, "ad-videos", business.id);
  }
  await admin.storage.from("avatars").remove([`${user.id}/avatar`]);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Verwijderen is mislukt. Probeer het later opnieuw." }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

async function removeFolder(admin: ReturnType<typeof createAdminClient>, bucket: string, folder: string) {
  for (let i = 0; i < 20; i++) {
    const { data } = await admin.storage.from(bucket).list(folder, { limit: 100 });
    if (!data || data.length === 0) return;
    const { error } = await admin.storage.from(bucket).remove(data.map((f) => `${folder}/${f.name}`));
    if (error) return;
  }
}

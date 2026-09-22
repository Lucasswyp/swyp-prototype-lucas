import { createClient } from "@/lib/supabase/client";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function validateUsernameFormat(username: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return "3-20 tekens: kleine letters, cijfers en underscores.";
  }
  return null;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("is_username_taken", { p_username: username });
  if (error) throw error;
  return data as boolean;
}

export interface ConsumerProfile {
  authUserId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

export async function fetchMyProfile(): Promise<ConsumerProfile | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase
    .from("consumers")
    .select("name, username, avatar_url")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    authUserId: userData.user.id,
    name: data.name,
    username: data.username,
    avatarUrl: data.avatar_url,
  };
}

export async function uploadAvatar(authUserId: string, file: File): Promise<string> {
  const supabase = createClient();
  // Fixed, extension-less path (not a random one, unlike ad-videos) so
  // re-uploading always replaces the old photo — including switching from a
  // .jpg to a .png, which would otherwise leave the old file behind forever
  // under a different name. contentType is passed explicitly since the path
  // itself no longer carries the file's actual type.
  const path = `${authUserId}/avatar`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the new photo shows immediately instead of the browser
  // serving the previous upload from cache at the same URL.
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function updateProfile(fields: { name?: string; username?: string; avatarUrl?: string }) {
  const supabase = createClient();
  const update: Record<string, string> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.username !== undefined) update.username = fields.username;
  if (fields.avatarUrl !== undefined) update.avatar_url = fields.avatarUrl;
  const { error } = await supabase.from("consumers").update(update).eq(
    "auth_user_id",
    (await supabase.auth.getUser()).data.user?.id
  );
  if (error) throw error;
}

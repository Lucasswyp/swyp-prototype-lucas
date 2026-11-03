import { createClient } from "@/lib/supabase/client";

export const MAX_LOGO_INPUT_BYTES = 10 * 1024 * 1024;

// Verkleint een foto in de browser (de originele telefoonfoto is vaak enkele MB groot, en
// dat kost bij elke weergave onnodig veel data). Een png blijft png zodat een transparant
// logo transparant blijft; alles anders wordt een jpeg.
export async function resizeImage(file: File, maxSize = 512): Promise<{ blob: Blob; type: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Deze afbeelding kan niet worden verwerkt.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.88));
  if (!blob) throw new Error("Deze afbeelding kan niet worden verwerkt.");
  return { blob, type };
}

// Logo of profielfoto van een bedrijf. Staat in dezelfde bucket als de profielfoto's van
// gebruikers, in de map van de eigenaar (zo staat het in het opslagbeleid: eerste mapnaam
// is de id van de ingelogde gebruiker).
export async function uploadBusinessLogo(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Kies een afbeelding (jpg, png of webp).");
  if (file.size > MAX_LOGO_INPUT_BYTES) throw new Error("Deze afbeelding is te groot (maximaal 10 MB).");
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Je bent niet ingelogd.");

  const { blob, type } = await resizeImage(file);
  const path = `${userData.user.id}/business-logo`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: type });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Een nieuwe parameter zodat de browser de nieuwe foto toont en niet de oude uit zijn geheugen.
  return `${data.publicUrl}?v=${Date.now()}`;
}

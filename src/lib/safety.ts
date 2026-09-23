import { createClient } from "@/lib/supabase/client";

export type ReportTargetType = "ad" | "business";
export type ReportReason = "inappropriate" | "scam" | "spam" | "other";

export async function submitReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  details?: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details || null,
  });
  if (error) throw error;
}

export async function fetchMyBlockedBusinessIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("blocked_businesses").select("business_id");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.business_id));
}

export async function blockBusiness(consumerId: string, businessId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("blocked_businesses")
    .upsert({ consumer_id: consumerId, business_id: businessId }, { onConflict: "consumer_id,business_id" });
  if (error) throw error;
}

export async function unblockBusiness(businessId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("blocked_businesses").delete().eq("business_id", businessId);
  if (error) throw error;
}

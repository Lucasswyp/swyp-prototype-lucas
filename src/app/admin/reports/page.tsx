"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Flag, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/googleAuth";

interface OpenReport {
  id: string;
  created_at: string;
  target_type: "message" | "user" | "ad" | "business";
  target_id: string;
  reason: string;
  details: string | null;
  reporter_username: string | null;
  context: Record<string, unknown> | null;
}

interface SuspendedUser {
  id: string;
  username: string | null;
  suspended_at: string;
}

type Status = "checking" | "signed-out" | "not-admin" | "ready";
type Action = "dismiss" | "remove_message" | "remove_and_suspend" | "suspend_user" | "reject_ad";

const TYPE_LABELS: Record<OpenReport["target_type"], string> = { message: "Bericht", user: "Gebruiker", ad: "Video", business: "Bedrijf" };
const REASON_LABELS: Record<string, string> = { inappropriate: "Ongepast", scam: "Oplichting", spam: "Spam", other: "Anders" };

function hoursSince(iso: string, now: number) {
  return (now - new Date(iso).getTime()) / 3_600_000;
}

function ageLabel(iso: string, now: number) {
  const hours = hoursSince(iso, now);
  if (hours < 1) return "minder dan een uur geleden";
  if (hours < 24) return `${Math.floor(hours)} uur geleden`;
  return `${Math.floor(hours / 24)} dag(en) geleden`;
}

// Standalone afhandelscherm voor meldingen (zie supabase/reports_moderation.sql).
// Alleen voor beheerders; de controle zit in de database-functies zelf.
export default function AdminReportsPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [reports, setReports] = useState<OpenReport[]>([]);
  const [suspended, setSuspended] = useState<SuspendedUser[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Het "nu" van de laatste keer laden; zo blijft het renderen zuiver.
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus("signed-out");
      return;
    }
    setEmail(userData.user.email ?? null);
    const [rep, sus] = await Promise.all([supabase.rpc("get_open_reports"), supabase.rpc("get_suspended_users")]);
    if (rep.error) {
      setStatus("not-admin");
      return;
    }
    setNow(Date.now());
    setReports((rep.data ?? []) as OpenReport[]);
    setSuspended((sus.data ?? []) as SuspendedUser[]);
    setStatus("ready");
  }, []);

  useEffect(() => {
    // Eerste keer laden: een externe fetch, geen afgeleide waarde.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function act(report: OpenReport, action: Action) {
    setBusyId(report.id);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("resolve_report", { p_id: report.id, p_action: action });
    setBusyId(null);
    if (rpcError || !data?.ok) {
      setError(`Dat lukte niet (${rpcError?.message ?? data?.reason ?? "onbekend"}).`);
      return;
    }
    if (action === "reject_ad") fetch("/api/algolia/reindex").catch(() => {});
    await load();
  }

  async function unsuspend(user: SuspendedUser) {
    setBusyId(user.id);
    const { error: rpcError } = await createClient().rpc("set_user_suspended", { p_consumer: user.id, p_suspended: false });
    setBusyId(null);
    if (rpcError) setError("Opheffen is mislukt.");
    else await load();
  }

  if (status === "checking") return <div className="min-h-screen bg-indigo p-8 text-sm text-white/50">Laden...</div>;

  if (status === "signed-out") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-indigo p-8 text-center text-white">
        <p className="text-sm text-white/60">Log in met je Swyp-account om meldingen af te handelen.</p>
        <button onClick={() => signInWithGoogle()} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo">
          Doorgaan met Google
        </button>
      </div>
    );
  }

  if (status === "not-admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-indigo p-8 text-center text-white">
        <p className="text-sm text-white/60">
          {email ? `Ingelogd als ${email}, maar dit account heeft geen adminrechten.` : "Geen adminrechten."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-indigo p-6 text-white">
      <nav className="mb-4 flex gap-4 text-sm text-white/50">
        <Link href="/admin/ads" className="hover:text-white">Advertenties</Link>
        <span className="font-semibold text-white">Meldingen ({reports.length})</span>
      </nav>
      <h1 className="mb-1 font-heading text-xl font-bold">Meldingen afhandelen</h1>
      <p className="mb-6 text-sm text-white/50">
        We beloven gebruikers en Apple dat gemelde inhoud binnen 24 uur wordt bekeken. De oudste staan bovenaan.
      </p>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-300">{error}</p>}

      {reports.length === 0 ? (
        <p className="text-sm text-white/40">Geen open meldingen.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((r) => {
            const ctx = r.context;
            const old = hoursSince(r.created_at, now) > 20;
            const busy = busyId === r.id;
            return (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-semibold"><Flag size={12} /> {TYPE_LABELS[r.target_type]}</span>
                  <span className="rounded-full bg-magenta/15 px-2.5 py-1 font-semibold text-magenta">{REASON_LABELS[r.reason] ?? r.reason}</span>
                  <span className={old ? "font-semibold text-amber-300" : "text-white/40"}>
                    {ageLabel(r.created_at, now)}{old ? " (bijna 24 uur!)" : ""}
                  </span>
                </div>
                <p className="mb-2 text-xs text-white/40">Gemeld door @{r.reporter_username ?? "onbekend"}</p>

                {!ctx && <p className="mb-3 text-sm text-white/50">De gemelde inhoud bestaat niet meer.</p>}
                {ctx && r.target_type === "message" && (
                  <div className="mb-3 rounded-xl bg-black/25 p-3 text-sm">
                    <p className="mb-1 text-xs text-white/40">
                      Van @{String(ctx.sender_username ?? "onbekend")}
                      {ctx.suspended ? " (al geschorst)" : ""}
                    </p>
                    <p className="whitespace-pre-wrap break-words">{ctx.kind === "video" ? "[doorgestuurde video]" : String(ctx.body ?? "")}</p>
                  </div>
                )}
                {ctx && r.target_type === "user" && (
                  <p className="mb-3 text-sm">@{String(ctx.username ?? "onbekend")}{ctx.suspended ? " (al geschorst)" : ""}</p>
                )}
                {ctx && r.target_type === "ad" && (
                  <p className="mb-3 text-sm">
                    {String(ctx.business ?? "")}: &ldquo;{String(ctx.caption ?? "")}&rdquo; <span className="text-white/40">({String(ctx.status)})</span>
                  </p>
                )}
                {ctx && r.target_type === "business" && <p className="mb-3 text-sm">{String(ctx.name ?? "")}</p>}

                <div className="flex flex-wrap gap-2">
                  {ctx && r.target_type === "message" && (
                    <>
                      <ActionButton busy={busy} tone="red" onClick={() => act(r, "remove_and_suspend")}>Verwijder en schors afzender</ActionButton>
                      <ActionButton busy={busy} tone="amber" onClick={() => act(r, "remove_message")}>Alleen verwijderen</ActionButton>
                    </>
                  )}
                  {ctx && r.target_type === "user" && <ActionButton busy={busy} tone="red" onClick={() => act(r, "suspend_user")}>Schors gebruiker</ActionButton>}
                  {ctx && r.target_type === "ad" && <ActionButton busy={busy} tone="red" onClick={() => act(r, "reject_ad")}>Keur video af</ActionButton>}
                  <ActionButton busy={busy} tone="grey" onClick={() => act(r, "dismiss")}>Negeren, geen actie nodig</ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suspended.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold"><ShieldOff size={16} /> Geschorste gebruikers</h2>
          <ul className="flex flex-col gap-2">
            {suspended.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <span>@{u.username ?? "onbekend"} <span className="text-white/40">sinds {new Date(u.suspended_at).toLocaleDateString("nl-NL")}</span></span>
                <button disabled={busyId === u.id} onClick={() => unsuspend(u)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
                  Opheffen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActionButton({ busy, tone, onClick, children }: { busy: boolean; tone: "red" | "amber" | "grey"; onClick: () => void; children: React.ReactNode }) {
  const tones = { red: "bg-red-500/90", amber: "bg-amber-500/80", grey: "bg-white/10 border border-white/15" };
  return (
    <button disabled={busy} onClick={onClick} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${tones[tone]}`}>
      {busy && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
}

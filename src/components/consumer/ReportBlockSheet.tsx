"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Flag, Ban, ChevronLeft, Check } from "lucide-react";
import type { ReportReason } from "@/lib/safety";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "inappropriate", label: "Ongepaste content" },
  { value: "scam", label: "Nepproduct of oplichting" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Anders" },
];

type View = "menu" | "report-reason" | "report-done" | "block-confirm" | "block-done";

export function ReportBlockSheet({
  open,
  onClose,
  companyName,
  onReport,
  onBlock,
}: {
  open: boolean;
  onClose: () => void;
  companyName: string;
  onReport: (reason: ReportReason) => Promise<void>;
  onBlock: () => Promise<void>;
}) {
  const [view, setView] = useState<View>("menu");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    onClose();
    setTimeout(() => setView("menu"), 300);
  }

  async function handleReport(reason: ReportReason) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onReport(reason);
      setView("report-done");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBlock() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onBlock();
      setView("block-done");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-t-3xl bg-slate p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <button
              onClick={handleClose}
              aria-label="Sluiten"
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            {view === "menu" && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setView("report-reason")}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-white/5"
                >
                  <Flag size={18} className="text-white/70" />
                  <span className="text-sm font-medium">Rapporteren</span>
                </button>
                <button
                  onClick={() => setView("block-confirm")}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-white/5"
                >
                  <Ban size={18} className="text-white/70" />
                  <span className="text-sm font-medium">Blokkeer {companyName}</span>
                </button>
              </div>
            )}

            {view === "report-reason" && (
              <div>
                <button
                  onClick={() => setView("menu")}
                  className="mb-3 flex items-center gap-1 text-sm text-white/50"
                >
                  <ChevronLeft size={16} /> Terug
                </button>
                <p className="mb-3 text-sm font-semibold">Waarom rapporteer je dit?</p>
                <div className="flex flex-col gap-1">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      disabled={submitting}
                      onClick={() => handleReport(r.value)}
                      className="rounded-xl px-3 py-3 text-left text-sm hover:bg-white/5 disabled:opacity-50"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "report-done" && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check size={22} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold">Bedankt voor je melding</p>
                <p className="text-xs text-white/50">We bekijken dit zo snel mogelijk.</p>
              </div>
            )}

            {view === "block-confirm" && (
              <div>
                <button
                  onClick={() => setView("menu")}
                  className="mb-3 flex items-center gap-1 text-sm text-white/50"
                >
                  <ChevronLeft size={16} /> Terug
                </button>
                <p className="mb-1 text-sm font-semibold">{companyName} blokkeren?</p>
                <p className="mb-4 text-xs text-white/50">
                  Je ziet dan geen advertenties meer van dit bedrijf. Je kunt dit later ongedaan maken.
                </p>
                <button
                  disabled={submitting}
                  onClick={handleBlock}
                  className="w-full rounded-xl bg-red-500/90 py-3 text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
                >
                  Blokkeren
                </button>
              </div>
            )}

            {view === "block-done" && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check size={22} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold">{companyName} geblokkeerd</p>
                <p className="text-xs text-white/50">Je ziet geen advertenties meer van dit bedrijf.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

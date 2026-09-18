"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/Logo";

export function LoginPromptModal() {
  const { promptOpen, closePrompt } = useConsumerAuth();

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  }

  return (
    <AnimatePresence>
      {promptOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
          onClick={closePrompt}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-3xl bg-slate p-6 pb-8 text-center"
          >
            <button
              onClick={closePrompt}
              aria-label="Sluiten"
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet to-magenta">
              <LogoMark size={26} />
            </div>
            <h2 className="font-heading text-lg font-bold mb-1.5">Welkom bij Swyp</h2>
            <p className="text-sm text-white/50 mb-5">
              Log in om Swyp Tokens te verdienen, producten op te slaan en rewards in te wisselen. Je kunt ook
              gewoon blijven kijken.
            </p>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full mb-2.5 flex items-center justify-center gap-2 rounded-xl bg-white text-indigo font-semibold text-sm py-3 hover:brightness-95"
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C33.9 5.4 29.2 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13.5 24 13.5c3.1 0 5.8 1.1 8 3l6-6C33.9 6.4 29.2 4.5 24 4.5c-7.5 0-14 4.1-17.7 10.2z" />
                <path fill="#4CAF50" d="M24 44.5c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.8 40.3 16.4 44.5 24 44.5z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.1c-.4.4 6.6-4.8 6.6-14.7 0-1.2-.1-2.4-.3-3.5z" />
              </svg>
              Doorgaan met Google
            </button>
            <Link href="/get-started/user" className="block">
              <button className="w-full mb-1 rounded-xl border border-white/15 bg-white/5 text-white font-semibold text-sm py-3 hover:bg-white/10">
                Doorgaan met e-mail
              </button>
            </Link>
            <button onClick={closePrompt} className="text-sm text-white/40 py-3">
              Later, ik wil eerst kijken
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

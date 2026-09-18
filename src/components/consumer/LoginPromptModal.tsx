"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { Button } from "@/components/ui/Button";

export function LoginPromptModal() {
  const { promptOpen, closePrompt } = useConsumerAuth();

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
            className="w-full max-w-md rounded-t-3xl bg-slate p-6 pb-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet to-magenta">
              <Heart size={26} className="fill-white text-white" />
            </div>
            <h2 className="font-heading text-lg font-bold mb-1.5">Log in om te liken en te sparen</h2>
            <p className="text-sm text-white/50 mb-5">
              Maak een gratis account om Swyp Tokens te verdienen, producten op te slaan en rewards in te wisselen.
            </p>
            <Link href="/get-started/user" className="block">
              <Button className="w-full mb-2">Account maken</Button>
            </Link>
            <button onClick={closePrompt} className="text-sm text-white/40 py-2">
              Later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

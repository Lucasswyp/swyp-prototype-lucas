"use client";

import { motion } from "framer-motion";
import { LogoMark, Logo } from "@/components/ui/Logo";

/**
 * Branded loading moment shown for the ~1s the feed takes to fetch its
 * first batch of ads — replaces a bare "loading" state with something that
 * feels like a deliberate app launch instead of a stalled page.
 */
export function SwypSplash() {
  return (
    <motion.div
      key="swyp-splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-indigo"
    >
      <motion.div
        aria-hidden="true"
        className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-violet to-magenta blur-[70px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <motion.div
          animate={{ scale: [1, 1.045, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        >
          <LogoMark size={76} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="relative mt-4"
      >
        <Logo size="md" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative mt-8 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/60"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

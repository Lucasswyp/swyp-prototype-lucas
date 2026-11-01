"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LOGO_RATIO } from "@/components/ui/Logo";
import { consumeSplashDecision, markActive } from "@/lib/launchSplash";

const PLAY_MS = 2900;
const PLAY_MS_REDUCED = 900;

/**
 * Lanceeranimatie met het echte logo. Speelt alleen bij een koude start (zie
 * lib/launchSplash.ts), nooit bij verversen of even wegswipen. Tik om over te slaan.
 */
export function LaunchSplash() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Pas na de eerste frame beslissen (en maar één keer, ook in StrictMode).
    const frame = requestAnimationFrame(() => {
      if (consumeSplashDecision()) setShow(true);
    });

    // "Laatst actief" bijhouden: bij weggaan, bij terugkomen en elke minuut.
    const touch = () => markActive();
    const onVisibility = () => touch();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", touch);
    const timer = window.setInterval(touch, 60_000);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", touch);
      window.clearInterval(timer);
    };
  }, []);

  const hide = useCallback(() => setShow(false), []);

  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(hide, reduce ? PLAY_MS_REDUCED : PLAY_MS);
    return () => window.clearTimeout(t);
  }, [show, reduce, hide]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="launch-splash"
          data-testid="launch-splash"
          role="presentation"
          onClick={hide}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-indigo"
        >
          {/* Gloed achter het logo */}
          <motion.div
            aria-hidden="true"
            className="absolute h-80 w-80 rounded-full bg-gradient-to-br from-violet to-magenta blur-[90px]"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={reduce ? { opacity: 0.35, scale: 1 } : { opacity: [0, 0.6, 0.38], scale: [0.6, 1.15, 1] }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />

          <div className="relative" style={{ width: "min(68vw, 300px)", aspectRatio: String(LOGO_RATIO) }}>
            <motion.img
              src="/brand/swyp-logo.png"
              alt="Swyp"
              draggable={false}
              className="h-full w-full select-none"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.86, filter: "blur(14px)" }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: reduce ? 0.4 : 0.95, ease: [0.22, 1, 0.36, 1] }}
            />
            {!reduce && (
              // Lichtstreep die alleen over de vorm van het logo glijdt
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{
                  WebkitMaskImage: "url(/brand/swyp-logo.png)",
                  maskImage: "url(/brand/swyp-logo.png)",
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                }}
              >
                <motion.div
                  className="absolute inset-y-0 w-1/3"
                  style={{
                    background: "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.85) 50%, transparent 100%)",
                  }}
                  initial={{ x: "-120%" }}
                  animate={{ x: "380%" }}
                  transition={{ duration: 0.9, delay: 0.95, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>

          <motion.p
            className="relative mt-8 text-[11px] font-bold tracking-[0.32em] text-white/80"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.3 : 0.6, delay: reduce ? 0.2 : 1.5 }}
          >
            SWIPE. <span className="text-[#FF3EDB]">SPAAR.</span> PROFITEER.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

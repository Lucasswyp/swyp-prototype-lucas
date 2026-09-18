"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Coins, Gift, Radar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const slides = [
  {
    icon: Sparkles,
    title: "Ontdek dingen die je écht leuk vindt",
    body: "Swyp toont je advertenties van merken die aansluiten bij jouw interesses — geen ruis, alleen relevant.",
  },
  {
    icon: Coins,
    title: "Swipe en verdien Swyp Tokens",
    body: "Elke keer dat je kijkt, liket of opslaat, verdien je Tokens. Jouw aandacht is waardevol.",
  },
  {
    icon: Gift,
    title: "Wissel je Tokens in voor echte voordelen",
    body: "Kortingen, gratis producten, upgrades en meer — rechtstreeks van de merken die je volgt.",
  },
  {
    icon: Radar,
    title: "Hoe beter Swyp jou kent, hoe relevanter je feed wordt",
    body: "Kies zo dadelijk je interesses. Je feed past zich continu aan op basis van wat je doet.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const isLast = step === slides.length - 1;
  const Slide = slides[step];

  return (
    <div className="flex h-full w-full flex-col justify-between px-6 pb-10 pt-16 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.25),transparent_60%)]">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center text-center gap-6"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet/30 to-magenta/20 border border-white/10 glow-violet">
            <Slide.icon size={36} className="text-white" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold leading-snug mb-3">{Slide.title}</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-[280px] mx-auto">{Slide.body}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-6 items-center">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-magenta" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
        <Button
          fullWidth
          size="lg"
          onClick={() => {
            if (isLast) router.push("/app/interests");
            else setStep((s) => s + 1);
          }}
        >
          {isLast ? "Start met Swyp" : "Volgende"}
        </Button>
        {!isLast && (
          <button
            className="text-sm text-white/40 hover:text-white/70"
            onClick={() => router.push("/app/interests")}
          >
            Overslaan
          </button>
        )}
      </div>
    </div>
  );
}

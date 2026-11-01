"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Bookmark, Send, ShoppingBag, ArrowUpRight, Play, UserPlus, Sparkles, Flame } from "lucide-react";
import { SwypToken } from "@/components/ui/SwypToken";
import { onReward, emitReward, type RewardEvent, type RewardKind } from "@/lib/rewardEvents";
import { hapticSuccess } from "@/lib/haptics";

type Sprite = "token" | "icon" | "spark";

interface Particle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  rotate: number;
  delay: number;
  sprite: Sprite;
}

interface Fx extends RewardEvent {
  id: number;
  particles: Particle[];
}

const THEME: Record<RewardKind, { glow: string; icon: typeof Heart; iconClass: string; text: string }> = {
  like: { glow: "rgba(255,62,219,0.55)", icon: Heart, iconClass: "fill-magenta text-magenta", text: "Like" },
  save: { glow: "rgba(255,255,255,0.35)", icon: Bookmark, iconClass: "fill-white text-white", text: "Bewaard" },
  view: { glow: "rgba(123,61,255,0.5)", icon: ShoppingBag, iconClass: "text-white", text: "Product bekeken" },
  click: { glow: "rgba(123,61,255,0.55)", icon: ArrowUpRight, iconClass: "text-white", text: "Doorgeklikt" },
  watch: { glow: "rgba(255,170,60,0.45)", icon: Play, iconClass: "fill-white text-white", text: "Goed gekeken" },
  follow: { glow: "rgba(255,62,219,0.5)", icon: UserPlus, iconClass: "text-white", text: "Gevolgd" },
  share: { glow: "rgba(123,61,255,0.55)", icon: Send, iconClass: "text-white", text: "Doorgestuurd" },
};

let nextId = 1;

function makeParticles(kind: RewardKind, points: number): Particle[] {
  const count = Math.min(26, 12 + Math.round(points * 0.6));
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 110 + Math.random() * 130;
    // Kijken: een regen van munten van boven. De rest: een ontploffing vanuit het midden.
    const rain = kind === "watch";
    out.push({
      id: i,
      dx: rain ? (Math.random() - 0.5) * 320 : Math.cos(angle) * distance,
      dy: rain ? 160 + Math.random() * 260 : Math.sin(angle) * distance,
      size: 14 + Math.random() * 16,
      rotate: (Math.random() - 0.5) * 540,
      delay: rain ? Math.random() * 0.5 : 0.28 + Math.random() * 0.06,
      sprite: i % 3 === 0 ? (kind === "like" || kind === "follow" ? "icon" : "spark") : "token",
    });
  }
  return out;
}

function ParticleView({ p, kind, reduced }: { p: Particle; kind: RewardKind; reduced: boolean }) {
  if (reduced) return null;
  const rain = kind === "watch";
  const Icon = THEME[kind].icon;
  return (
    <motion.span
      className="absolute left-0 top-0"
      initial={{ x: rain ? p.dx : 0, y: rain ? -260 : 0, scale: 0, opacity: 0, rotate: 0 }}
      animate={{ x: p.dx, y: p.dy, scale: [0, 1.25, 0.9], opacity: [0, 1, 1, 0], rotate: p.rotate }}
      transition={{ duration: rain ? 1.3 : 1.15, delay: p.delay, ease: "easeOut", times: [0, 0.25, 0.7, 1] }}
    >
      {p.sprite === "token" && <SwypToken size={p.size} />}
      {p.sprite === "spark" && <Sparkles size={p.size} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />}
      {p.sprite === "icon" && <Icon size={p.size} className="fill-magenta text-magenta drop-shadow-[0_0_8px_rgba(255,62,219,0.9)]" />}
    </motion.span>
  );
}

function FxView({ fx, reduced }: { fx: Fx; reduced: boolean }) {
  const theme = THEME[fx.kind];
  const Icon = theme.icon;
  const big = fx.streakBonus >= 30;
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* een korte glans over het hele scherm */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 46%, ${theme.glow}, transparent 62%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, times: [0, 0.3, 1], ease: "easeOut" }}
        />
      )}

      <div className="absolute left-1/2 top-[46%]">
        {/* schokgolf */}
        {!reduced && fx.kind !== "watch" && (
          <motion.span
            className="absolute -left-24 -top-24 h-48 w-48 rounded-full border-4"
            style={{ borderColor: theme.glow }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          />
        )}

        {/* het grote icoon: groeit, trilt even en ontploft */}
        {!reduced && fx.kind !== "watch" && (
          <motion.div
            className="absolute -left-16 -top-16 flex h-32 w-32 items-center justify-center"
            initial={{ scale: 0, rotate: -14, opacity: 0 }}
            animate={{ scale: [0, 1.25, 1, 1.05, 2.2], rotate: [-14, 6, 0, -3, 0], opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 0.95, times: [0, 0.28, 0.45, 0.62, 1], ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 28px ${theme.glow})` }}
          >
            <Icon size={112} strokeWidth={1.8} className={theme.iconClass} />
          </motion.div>
        )}

        {/* deeltjes */}
        {fx.particles.map((p) => (
          <ParticleView key={p.id} p={p} kind={fx.kind} reduced={reduced} />
        ))}

        {/* de punten */}
        <div className="absolute left-0 top-0 flex -translate-x-1/2 flex-col items-center gap-2">
          {fx.points > 0 && (
            <motion.div
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-violet to-magenta px-5 py-2.5 font-heading text-2xl font-extrabold text-white shadow-[0_0_36px_rgba(255,62,219,0.7)]"
              initial={{ y: 10, scale: 0.3, opacity: 0 }}
              animate={reduced ? { y: -70, scale: 1, opacity: [0, 1, 1, 0] } : { y: [10, -20, -120], scale: [0.3, 1.35, 1], opacity: [0, 1, 1, 0] }}
              transition={{ duration: reduced ? 1.1 : 1.7, delay: reduced ? 0 : 0.3, times: [0, 0.25, 0.8, 1], ease: "easeOut" }}
            >
              <SwypToken size={26} /> +{fx.points} SWYP
            </motion.div>
          )}
          {fx.streakBonus > 0 && (
            <motion.div
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-orange-500/95 px-4 py-1.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,150,40,0.7)]"
              initial={{ y: 10, scale: 0.4, opacity: 0 }}
              animate={reduced ? { y: -70, scale: 1, opacity: [0, 1, 1, 0] } : { y: [10, -20, -120], scale: [0.4, big ? 1.3 : 1.12, 1], opacity: [0, 1, 1, 0] }}
              transition={{ duration: reduced ? 1.1 : 1.7, delay: reduced ? 0.2 : 0.5, times: [0, 0.25, 0.8, 1], ease: "easeOut" }}
            >
              <Flame size={16} /> {big ? `Week compleet! +${fx.streakBonus}` : `Streakbonus +${fx.streakBonus}`}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Laat bij elke beloning een feest zien: grote iconen die ontploffen, munten die
// eruit vliegen, een glans en de punten die omhoog zweven. Hoort één keer in de
// app-schil te staan (zie app/layout.tsx).
export function RewardFxLayer() {
  const [effects, setEffects] = useState<Fx[]>([]);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const play = (event: RewardEvent) => {
      const fx: Fx = { ...event, id: nextId++, particles: makeParticles(event.kind, event.points) };
      setEffects((list) => [...list.slice(-2), fx]);
      hapticSuccess();
      window.setTimeout(() => setEffects((list) => list.filter((f) => f.id !== fx.id)), 2600);
    };
    const off = onReward(play);
    // Alleen tijdens lokaal ontwikkelen: zo kun je een animatie zonder account bekijken.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __swypFx?: typeof emitReward }).__swypFx = emitReward;
    }
    return off;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[80] overflow-hidden" aria-hidden>
      <AnimatePresence>
        {effects.map((fx) => (
          <FxView key={fx.id} fx={fx} reduced={reduced} />
        ))}
      </AnimatePresence>
    </div>
  );
}

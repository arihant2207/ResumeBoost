"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ArrowRight, TrendingUp, CheckCircle2 } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";

// ---------------------------------------------------------------------------
// Premium easing — cubic-bezier(0.22, 1, 0.36, 1)
// Same curve used by Framer and Linear for their motion systems.
// ---------------------------------------------------------------------------
const PREMIUM = [0.22, 1, 0.36, 1] as const;

// ---------------------------------------------------------------------------
// useCountUp — RAF-driven, cubic ease-out, zero dependencies
// ---------------------------------------------------------------------------
function useCountUp(
  start: number,
  end: number,
  duration: number,
  trigger: boolean
): number {
  const [value, setValue] = useState(start);
  useEffect(() => {
    if (!trigger) return;
    setValue(start);
    let rafId: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const elapsed = now - t0;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(start + eased * (end - start)));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [start, end, duration, trigger]);
  return value;
}

// ---------------------------------------------------------------------------
// GlowButton — luxury pill CTA with Framer-style white glow on hover.
//
// Specification (from design brief):
//   box-shadow on hover:
//     0 0 40px rgba(255,255,255,0.35)   ← near glow
//     0 0 80px rgba(255,255,255,0.15)   ← mid halo
//     0 0 120px rgba(255,255,255,0.08)  ← far bloom
//   scale: 1.03 on hover
//   transition: 0.4s ease / cubic-bezier(0.22,1,0.36,1)
//   radial ambient light behind button fades in/out
//
// The same component is used for the primary CTA and the nav "Get Started".
// ---------------------------------------------------------------------------
interface GlowButtonProps {
  href: string;
  children: React.ReactNode;
  /** Extra padding / size classes */
  className?: string;
  /** Extra inline styles (background, border) */
  surfaceStyle?: React.CSSProperties;
}

function GlowButton({
  href,
  children,
  className = "",
  surfaceStyle = {},
}: GlowButtonProps) {
  const [hovered, setHovered] = useState(false);

  const TRANSITION = "0.4s ease";
  const SCALE_TRANSITION = `transform 0.4s cubic-bezier(${PREMIUM.join(",")})`;

  return (
    <div className="relative inline-flex">
      {/* ── Ambient radial halo — blurred disk that blooms behind button ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 rounded-full"
        style={{
          width: "200%",
          height: "380%",
          transform: `translate(-50%, -50%) scale(${hovered ? 1 : 0.35})`,
          opacity: hovered ? 1 : 0,
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)",
          filter: "blur(20px)",
          transition: `opacity ${TRANSITION}, transform 0.5s cubic-bezier(${PREMIUM.join(",")})`,
        }}
      />

      {/* ── Button surface ── */}
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative inline-flex items-center justify-center gap-2.5 rounded-full text-white ${className}`}
        style={{
          ...surfaceStyle,
          boxShadow: hovered
            ? "0 0 40px rgba(255,255,255,0.35), 0 0 80px rgba(255,255,255,0.15), 0 0 120px rgba(255,255,255,0.08)"
            : "none",
          transform: hovered ? "scale(1.03)" : "scale(1)",
          transition: `box-shadow ${TRANSITION}, ${SCALE_TRANSITION}`,
        }}
      >
        {children}
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DarkLogo — Cormorant Garamond serif wordmark on #050505
// ---------------------------------------------------------------------------
function DarkLogo() {
  return <Logo size="md" />;
}

// ---------------------------------------------------------------------------
// NavLink — underline-reveal on hover, premium easing
// ---------------------------------------------------------------------------
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group relative text-sm font-medium transition-colors duration-300 hover:text-white"
      style={{ color: "rgba(255,255,255,0.45)" }}
    >
      {children}
      <span
        className="absolute -bottom-0.5 left-0 h-px w-0 rounded-full bg-white/25 group-hover:w-full"
        style={{
          transition: `width 0.35s cubic-bezier(${PREMIUM.join(",")})`,
        }}
      />
    </a>
  );
}

// ---------------------------------------------------------------------------
// ProductCard — glassmorphism ATS dashboard, animated counters
// ---------------------------------------------------------------------------
function ProductCard({ trigger }: { trigger: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const atsScore = useCountUp(58, 91, 1200, trigger);
  const progressW = useCountUp(0, 91, 1500, trigger);
  const kwMatch = useCountUp(0, 94, 1100, trigger);

  return (
    <div className="relative">
      {/* ── Ambient glow that wraps the card — blue halo ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 85%, rgba(65,105,200,0.22) 0%, rgba(50,85,165,0.08) 40%, transparent 70%)",
          filter: "blur(36px)",
        }}
      />

      {/* ── Floating idle animation ── */}
      <motion.div
        animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Gradient border ring */}
        <div
          className="rounded-2xl p-px"
          style={{
            background:
              "linear-gradient(155deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.03) 40%, rgba(138,180,216,0.14) 100%)",
          }}
        >
          {/* Glass surface */}
          <div
            className="rounded-2xl px-8 py-8 sm:px-10 sm:py-9"
            style={{
              background: "rgba(5,6,10,0.92)",
              backdropFilter: "blur(64px)",
              WebkitBackdropFilter: "blur(64px)",
              boxShadow:
                "0 48px 120px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.08) inset",
            }}
          >
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  ResumeBoost AI Analysis
                </p>
                <p
                  className="mt-1.5 text-[13px] font-medium"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Resume optimization complete
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                style={{
                  background: "rgba(138,180,216,0.07)",
                  border: "1px solid rgba(138,180,216,0.18)",
                  color: "#8AB4D8",
                }}
              >
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{
                    background: "#8AB4D8",
                    boxShadow: "0 0 8px rgba(138,180,216,0.8)",
                  }}
                />
                AI Powered
              </span>
            </div>

            {/* ATS Score */}
            <div className="mb-8">
              <p
                className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                ATS Score
              </p>
              <div className="mb-5 flex items-end justify-between">
                <div className="flex items-center gap-5">
                  <div>
                    <p
                      className="font-mono text-[2rem] font-bold leading-none"
                      style={{ color: "rgba(255,255,255,0.20)" }}
                    >
                      58
                    </p>
                    <p
                      className="mt-1 text-[10px]"
                      style={{ color: "rgba(255,255,255,0.15)" }}
                    >
                      Before
                    </p>
                  </div>
                  <svg
                    width="36"
                    height="14"
                    viewBox="0 0 36 14"
                    fill="none"
                    aria-hidden
                  >
                    <line
                      x1="0"
                      y1="7"
                      x2="28"
                      y2="7"
                      stroke="rgba(255,255,255,0.10)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M24 3 L32 7 L24 11"
                      stroke="rgba(255,255,255,0.10)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  <div>
                    <p
                      className="font-mono text-[3.4rem] font-bold leading-none text-white"
                      style={{
                        textShadow:
                          "0 0 50px rgba(138,180,216,0.20), 0 0 20px rgba(255,255,255,0.06)",
                      }}
                    >
                      {atsScore}
                    </p>
                    <p
                      className="mt-1 text-[10px]"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      After
                    </p>
                  </div>
                </div>
                <span
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold"
                  style={{
                    background: "rgba(138,180,216,0.06)",
                    border: "1px solid rgba(138,180,216,0.14)",
                    color: "#8AB4D8",
                  }}
                >
                  <TrendingUp className="size-3" />
                  +{atsScore - 58} pts
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="h-[2px] overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progressW}%`,
                    background:
                      "linear-gradient(90deg, rgba(72,112,190,0.50) 0%, #8AB4D8 100%)",
                    boxShadow: "0 0 12px rgba(138,180,216,0.50)",
                  }}
                />
              </div>
            </div>

            {/* Gradient divider */}
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent 100%)",
                marginBottom: 28,
              }}
            />

            {/* Stats row */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              <div>
                <p
                  className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  Keyword Match
                </p>
                <p className="font-mono text-[1.65rem] font-bold text-white">
                  {kwMatch}%
                </p>
              </div>
              <div>
                <p
                  className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  Missing Skills
                </p>
                <p className="font-mono text-[1.65rem] font-bold text-white">
                  12
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  identified
                </p>
              </div>
              <div>
                <p
                  className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  ATS Result
                </p>
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: "#8AB4D8" }}
                >
                  Passed
                </p>
              </div>
            </div>

            {/* Completion row */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3.5"
              style={{
                background: "rgba(138,180,216,0.04)",
                border: "1px solid rgba(138,180,216,0.09)",
              }}
            >
              <CheckCircle2
                className="size-4 shrink-0"
                style={{ color: "#8AB4D8" }}
              />
              <p
                className="text-[13px] font-medium"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Optimization complete — Resume ready for download
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero — main export
// ---------------------------------------------------------------------------
export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  // Scroll-driven transforms
  const { scrollY } = useScroll();
  const contentOpacity = useTransform(scrollY, [0, 380], [1, 0]);
  const contentY = useTransform(scrollY, [0, 380], [0, -56]);
  const cardScale = useTransform(scrollY, [200, 620], [1, 0.91]);

  // Card counter trigger
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: true, margin: "-60px" });

  // Entrance animation factory
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, ease: PREMIUM, delay },
  });

  return (
    <section
      className="relative flex min-h-screen w-full flex-col overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* ================================================================
          BACKGROUND — three organic blue light forms.
          Bottom-left: primary studio fill.
          Bottom-right: complementary fill.
          Center-bottom: card halo — placed slightly behind the ATS card.
          Motion: slow drift + morph, extremely subtle.
          ================================================================ */}
      {!prefersReducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
        >
          {/* Bottom-left — primary blue fill light */}
          <motion.div
            style={{
              position: "absolute",
              width: 1000,
              height: 820,
              bottom: "-22%",
              left: "-22%",
              borderRadius: "50% 60% 55% 45% / 50% 45% 60% 50%",
              background:
                "radial-gradient(ellipse at 45% 55%, rgba(55,95,185,0.16) 0%, rgba(40,75,155,0.07) 40%, transparent 72%)",
              filter: "blur(90px)",
            }}
            animate={{
              borderRadius: [
                "50% 60% 55% 45% / 50% 45% 60% 50%",
                "60% 50% 45% 55% / 45% 60% 50% 55%",
                "55% 45% 60% 50% / 60% 50% 45% 55%",
                "50% 60% 55% 45% / 50% 45% 60% 50%",
              ],
              x: [0, 50, -20, 0],
              y: [0, -40, 35, 0],
            }}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Bottom-right — complementary blue fill light */}
          <motion.div
            style={{
              position: "absolute",
              width: 900,
              height: 740,
              bottom: "-18%",
              right: "-20%",
              borderRadius: "55% 45% 60% 50% / 45% 55% 50% 60%",
              background:
                "radial-gradient(ellipse at 55% 45%, rgba(48,88,175,0.13) 0%, rgba(36,70,145,0.06) 40%, transparent 72%)",
              filter: "blur(100px)",
            }}
            animate={{
              borderRadius: [
                "55% 45% 60% 50% / 45% 55% 50% 60%",
                "45% 60% 50% 55% / 60% 45% 55% 50%",
                "60% 50% 45% 55% / 50% 60% 45% 55%",
                "55% 45% 60% 50% / 45% 55% 50% 60%",
              ],
              x: [0, -45, 28, 0],
              y: [0, -32, 48, 0],
            }}
            transition={{
              duration: 27,
              repeat: Infinity,
              ease: "easeInOut",
              delay: -11,
            }}
          />

          {/* Center-bottom card halo — behind the ATS card, blue bloom */}
          <motion.div
            style={{
              position: "absolute",
              width: 700,
              height: 500,
              bottom: "-8%",
              left: "50%",
              transform: "translateX(-50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at center, rgba(60,100,190,0.10) 0%, transparent 70%)",
              filter: "blur(72px)",
            }}
            animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: -6 }}
          />
        </div>
      )}

      {/* ================================================================
          NAVBAR
          ================================================================ */}
      <nav
        className="relative z-50 mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-8 sm:px-10"
        aria-label="Main navigation"
      >
        <DarkLogo />

        <div className="hidden items-center gap-10 md:flex">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#how-it-works">How It Works</NavLink>
          <NavLink href="#generator">Try it</NavLink>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="hidden text-sm font-medium transition-colors duration-300 hover:text-white sm:block"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            Sign In
          </Link>
          {/* Get Started — same glow as primary CTA */}
          <GlowButton
            href="/signup"
            className="px-5 py-2 text-sm font-medium"
            surfaceStyle={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.11)",
            }}
          >
            Get Started
          </GlowButton>
        </div>
      </nav>

      {/* ================================================================
          HERO CONTENT
          ================================================================ */}
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 pt-10 pb-12 text-center sm:px-10"
        style={
          prefersReducedMotion ? {} : { opacity: contentOpacity, y: contentY }
        }
      >
        {/* Eyebrow badge */}
        <motion.div className="mb-12" {...enter(0)}>
          <span
            className="inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-[13px] font-medium tracking-wide"
            style={{
              background: "rgba(138,180,216,0.06)",
              border: "1px solid rgba(138,180,216,0.16)",
              color: "rgba(138,180,216,0.75)",
            }}
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{
                background: "#8AB4D8",
                boxShadow: "0 0 8px rgba(138,180,216,0.80)",
              }}
            />
            AI Resume Optimization
          </span>
        </motion.div>

        {/* ── Headline — Cormorant Garamond, ultra-luxury editorial ──
            Line 1: dominant, ~120px. Drives the cinematic first impression.
            Line 2: sized to fit on ONE LINE (~52px). Softer, completing tone. */}
        <motion.h1
          className="font-serif font-bold text-white"
          style={{ lineHeight: 0.95, letterSpacing: "-0.025em" }}
          {...enter(0.09)}
        >
          <span
            className="block"
            style={{ fontSize: "clamp(3.2rem, 8.8vw, 7.8rem)" }}
          >
            Land More Interviews.
          </span>
          <span
            className="mt-2 block"
            style={{
              fontSize: "clamp(1.45rem, 3.65vw, 3.3rem)",
              color: "rgba(255,255,255,0.48)",
              letterSpacing: "-0.015em",
            }}
          >
            With an ATS-Optimized Resume.
          </span>
        </motion.h1>

        {/* Subheadline — two explicit lines */}
        <motion.div className="mt-12" {...enter(0.18)}>
          <p
            className="leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "clamp(1rem, 1.65vw, 1.42rem)",
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            Upload your resume and job description.
          </p>
          <p
            className="leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "clamp(1rem, 1.65vw, 1.42rem)",
              maxWidth: 680,
              margin: "0 auto",
            }}
          >
            Get ATS insights, keyword optimization, and a recruiter-ready PDF
            in minutes.
          </p>
        </motion.div>

        {/* ── CTA buttons ── */}
        <motion.div
          className="mt-14 flex flex-col items-center gap-5 sm:flex-row"
          {...enter(0.27)}
        >
          {/* Primary — luxury pill, white glow on hover */}
          <GlowButton
            href="#generator"
            className="px-9 py-4 text-[15px] font-semibold"
            surfaceStyle={{
              background: "rgba(3,3,5,0.90)",
              border: "1px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            Try ResumeBoost
            <ArrowRight className="size-4" aria-hidden />
          </GlowButton>

          {/* Secondary — pure text link, underline-reveal */}
          <a
            href="#how-it-works"
            className="group relative inline-block text-[15px] font-medium"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            <span
              className="transition-colors duration-300 group-hover:text-white/70"
              style={{
                transition: `color 0.35s cubic-bezier(${PREMIUM.join(",")})`,
              }}
            >
              How it works
            </span>
            <span
              className="absolute -bottom-0.5 left-0 h-px w-0 rounded-full bg-white/30 group-hover:w-full"
              style={{
                transition: `width 0.4s cubic-bezier(${PREMIUM.join(",")})`,
              }}
            />
          </a>
        </motion.div>
      </motion.div>

      {/* ================================================================
          PRODUCT CARD
          ================================================================ */}
      <div
        ref={cardRef}
        className="relative z-10 mx-auto mb-16 mt-2 w-full max-w-[640px] px-6 sm:px-10"
      >
        <motion.div
          style={prefersReducedMotion ? {} : { scale: cardScale }}
          initial={{ opacity: 0, y: 56 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: PREMIUM, delay: 0.44 }}
        >
          <ProductCard trigger={cardInView} />
        </motion.div>
      </div>

      {/* Bottom edge — dark hero dissolves into light editorial sections */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-32"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(5,5,5,0.55))",
        }}
        aria-hidden
      />
    </section>
  );
}

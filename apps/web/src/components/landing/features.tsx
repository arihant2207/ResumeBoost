"use client";

import { useRef } from "react";
import {
  BarChart3,
  FileCheck,
  FileUp,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";

const features = [
  {
    icon: FileUp,
    title: "Smart upload",
    description:
      "Drop your PDF or DOCX resume. We extract and structure your experience automatically.",
  },
  {
    icon: Target,
    title: "JD analysis",
    description:
      "Paste any job description. AI identifies required skills, keywords, and seniority signals.",
  },
  {
    icon: Sparkles,
    title: "AI optimization",
    description:
      "Bullets and summary rewritten to align with the role while staying truthful to your background.",
  },
  {
    icon: BarChart3,
    title: "ATS scoring",
    description:
      "See keyword coverage, formatting checks, and actionable suggestions before you apply.",
  },
  {
    icon: FileCheck,
    title: "LaTeX PDF export",
    description:
      "Clean, single-column layouts that parse reliably in applicant tracking systems.",
  },
  {
    icon: Zap,
    title: "Fast turnaround",
    description:
      "From upload to downloadable PDF in minutes — no manual reformatting in Word.",
  },
];

interface Feature {
  icon: any;
  title: string;
  description: string;
}

function CardContentComponent({ feature }: { feature: Feature }) {
  return (
    <div className="group relative rounded-[20px] border border-white/[0.12] bg-white/[0.02] backdrop-blur-md p-6 sm:p-8 transition-all duration-300 hover:border-white/[0.20] hover:-translate-y-1 overflow-hidden text-left">
      {/* Very subtle blue reflection in background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.015] pointer-events-none" />
      
      {/* Very subtle glass highlight on hover */}
      <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Icon container — small dark glass square, small border, no glow */}
      <div className="relative mb-6 flex size-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/90">
        <feature.icon className="size-5 text-white" aria-hidden />
      </div>

      <h3 className="text-xl font-semibold text-white tracking-tight mb-3">
        {feature.title}
      </h3>
      
      <p className="text-white/60 leading-relaxed text-sm sm:text-base">
        {feature.description}
      </p>
    </div>
  );
}

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of the container relative to the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  // Smooth the scroll line animation
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });

  return (
    <section 
      id="features" 
      ref={containerRef}
      className="relative bg-[#050505] overflow-hidden px-4 py-24 sm:px-6 sm:py-36 lg:px-8 border-t border-white/[0.08]"
    >
      {/* Extremely subtle blue ambient fog near bottom corners */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-500/[0.02] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/[0.02] blur-[150px] pointer-events-none" />
      
      <div className="mx-auto max-w-6xl relative z-10">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-20 md:mb-28">
          {/* Eyebrow badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-900/50 bg-[#280505]/80 backdrop-blur-md px-3.5 py-1 text-xs font-semibold tracking-wider text-red-300 uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
              <Sparkles className="size-3 text-red-400" aria-hidden />
              Built for job seekers
            </span>
          </div>
          
          <h2 className="text-4xl font-light tracking-tight md:text-5xl lg:text-6xl text-white font-serif">
            Everything you need to beat the ATS
          </h2>
          
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-white/60 max-w-xl mx-auto">
            Built for job seekers who want data-driven resume improvements, not
            generic templates.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative mt-16 max-w-4xl mx-auto">
          {/* The background track line (dark gray base line) */}
          <div className="absolute left-4 md:left-1/2 top-[100px] md:top-[130px] bottom-[100px] md:bottom-[130px] w-[1px] bg-neutral-800 -translate-x-1/2" />
          
          {/* The scroll-linked animated line (solid white progress segment) */}
          <motion.div
            style={{ scaleY }}
            className="absolute left-4 md:left-1/2 top-[100px] md:top-[130px] bottom-[100px] md:bottom-[130px] w-[1px] bg-white -translate-x-1/2 origin-top"
          />

          {/* Denser spacing with space-y-10 md:space-y-20 */}
          <div className="space-y-10 md:space-y-20">
            {features.map((feature, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div key={feature.title} className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-center">
                  {/* Left Column (Desktop Left card) */}
                  <div className="hidden md:block">
                    {isLeft && (
                      <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-120px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full relative pr-12 lg:pr-16"
                      >
                        {/* Dashed connector line */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 lg:w-16 h-0 border-t border-dashed border-white/[0.18]" />
                        <CardContentComponent feature={feature} />
                      </motion.div>
                    )}
                  </div>

                  {/* Right Column (Desktop Right card / Mobile Right Card) */}
                  <div className="pl-12 md:pl-0">
                    {/* Desktop rendering when isRight */}
                    <div className="hidden md:block">
                      {!isLeft && (
                        <motion.div
                          initial={{ opacity: 0, x: 40 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-120px" }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          className="w-full relative pl-12 lg:pl-16"
                        >
                          {/* Dashed connector line */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 lg:w-16 h-0 border-t border-dashed border-white/[0.18]" />
                          <CardContentComponent feature={feature} />
                        </motion.div>
                      )}
                    </div>

                    {/* Mobile rendering for all cards (always on right side, always sliding from right) */}
                    <div className="block md:hidden">
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-120px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full relative"
                      >
                        {/* Dashed connector line on mobile: runs from timeline line (left-4) to card start (pl-12) */}
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-0 border-t border-dashed border-white/[0.18]" />
                        <CardContentComponent feature={feature} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

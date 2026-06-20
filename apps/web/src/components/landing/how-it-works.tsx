"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Upload resume",
    description: "PDF or DOCX up to 10 MB. Your file stays private.",
  },
  {
    step: "02",
    title: "Paste job description",
    description:
      "Copy the full posting from LinkedIn, Indeed, or any careers page.",
  },
  {
    step: "03",
    title: "Generate & download",
    description:
      "Review your ATS score, optimized content, and download an ATS-friendly PDF.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function HowItWorks() {
  return (
    <section 
      id="how-it-works" 
      className="relative bg-[#050505] overflow-hidden px-4 py-24 sm:px-6 sm:py-36 lg:px-8 border-t border-white/[0.08]"
    >
      {/* Extremely subtle blue ambient fog near bottom corners */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.012] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.012] blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-24">
          {/* Eyebrow badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-900/50 bg-[#280505]/80 backdrop-blur-md px-3.5 py-1 text-xs font-semibold tracking-wider text-red-300 uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
              <Sparkles className="size-3 text-red-400" aria-hidden />
              Simple three-step process
            </span>
          </div>
          
          <h2 className="text-4xl font-light tracking-tight md:text-5xl lg:text-6xl text-white font-serif">
            Three steps to a stronger application
          </h2>
          
          <p className="mt-6 text-lg leading-relaxed text-white/65 max-w-[700px] mx-auto">
            No account required for this preview. Full auth and backend sync in
            Phase 2.
          </p>
        </div>

        {/* 3-Column horizontal process cards staggered on scroll */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-12 md:gap-16 grid-cols-1 md:grid-cols-3 text-left"
        >
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              variants={itemVariants}
              className="relative group"
            >
              {/* Connector line extending from step number to the next step (desktop only) */}
              {index < steps.length - 1 && (
                <div
                  className="absolute hidden md:block border-t border-dashed border-white/12"
                  style={{
                    left: "3.5rem", // starts after the monospace indicator
                    right: "-4rem", // spans across the column gap
                    top: "0.5rem",   // aligns centered with the monospace text
                  }}
                />
              )}

              {/* Step Number */}
              <span className="font-mono text-xs sm:text-sm text-blue-400/80 tracking-widest uppercase transition-colors duration-300 group-hover:text-blue-300">
                [{item.step}]
              </span>

              {/* Step Title */}
              <h3 className="mt-4 text-2xl sm:text-3xl font-light text-white font-serif tracking-tight leading-snug transition-colors duration-300 group-hover:text-white">
                / {item.title}
              </h3>

              {/* Step Description */}
              <p className="mt-3 text-base text-white/70 font-sans leading-relaxed transition-colors duration-300 group-hover:text-white/85">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

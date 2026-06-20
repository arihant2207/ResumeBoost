"use client";

import { FadeInWhenVisible } from "@/components/motion/fade-in";
import { Sparkles } from "lucide-react";

export function GeneratorSectionHeading() {
  return (
    <FadeInWhenVisible>
      <div className="mx-auto mb-16 max-w-2xl text-center">
        {/* Section Badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-900/50 bg-[#280505]/80 backdrop-blur-md px-3.5 py-1 text-xs font-semibold tracking-wider text-red-300 uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
            <Sparkles className="size-3 text-red-400" aria-hidden />
            Try the resume generator
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-light tracking-tight md:text-5xl lg:text-6xl text-white font-serif">
          Try the resume generator
        </h2>

        {/* Description */}
        <p className="mt-6 text-lg leading-relaxed text-white/70 max-w-[700px] mx-auto font-sans">
          Upload your resume and paste a job description. AI will optimize
          your resume and generate an ATS-friendly PDF in minutes.
        </p>
      </div>
    </FadeInWhenVisible>
  );
}

/**
 * Landing page.
 *
 * <Hero> is self-contained and includes the dark transparent navbar.
 * The shared <Header> is not used here — it's used by app pages
 * (optimize, etc.) that need an opaque light-mode nav.
 *
 * Layout rhythm:
 *   Dark cinematic hero  (#050505)
 *   → Light editorial features section (warm-grey muted bg)
 *   → Light editorial how-it-works
 *   → Light generator section
 *   → Footer
 */
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ResumeGenerator } from "@/components/resume/resume-generator";
import { Footer } from "@/components/layout/footer";
import { GeneratorSectionHeading } from "@/components/landing/generator-section-heading";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Dark full-viewport hero — includes its own navbar */}
        <Hero />

        {/* Light editorial sections below */}
        <Features />
        <HowItWorks />

        <section
          id="generator"
          className="relative bg-[#050505] overflow-hidden px-4 py-24 sm:px-6 sm:py-36 lg:px-8 border-t border-white/[0.08]"
        >
          {/* Extremely subtle blue ambient fog near bottom corners */}
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.015] blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.015] blur-[150px] pointer-events-none" />

          <div className="mx-auto max-w-6xl relative z-10">
            <GeneratorSectionHeading />
            <ResumeGenerator />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
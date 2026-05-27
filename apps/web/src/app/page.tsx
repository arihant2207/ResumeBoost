import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ResumeGenerator } from "@/components/resume/resume-generator";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />

      <section
        id="generator"
        className="border-t bg-muted/10 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Try the resume generator
            </h2>
            <p className="mt-4 text-muted-foreground">
              Upload your resume and paste a job description below. Text
              extraction runs on the FastAPI backend; ATS scoring and PDF
              download are still placeholders.
            </p>
          </div>

          <ResumeGenerator />
        </div>
      </section>
    </>
  );
}

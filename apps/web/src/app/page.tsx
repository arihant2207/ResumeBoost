import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ResumeGenerator } from "@/components/resume/resume-generator";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
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
                Upload your resume and paste a job description. AI will optimize
                your resume and generate an ATS-friendly PDF in minutes.
              </p>
            </div>
            <ResumeGenerator />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
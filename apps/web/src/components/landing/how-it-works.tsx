const steps = [
  {
    step: "01",
    title: "Upload resume",
    description: "PDF or DOCX up to 10 MB. Your file stays private.",
  },
  {
    step: "02",
    title: "Paste job description",
    description: "Copy the full posting from LinkedIn, Indeed, or any careers page.",
  },
  {
    step: "03",
    title: "Generate & download",
    description:
      "Review your ATS score, optimized content, and download an ATS-friendly PDF.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps to a stronger application
          </h2>
          <p className="mt-4 text-muted-foreground">
            No account required for this preview. Full auth and backend sync in
            Phase 2.
          </p>
        </div>

        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step} className="relative">
              <span className="text-5xl font-bold text-primary/15">
                {item.step}
              </span>
              <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

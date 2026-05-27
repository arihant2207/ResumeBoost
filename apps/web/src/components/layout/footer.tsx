import Link from "next/link";
import { FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="size-4" aria-hidden />
              </span>
              ResumeBoost
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              AI-powered resume optimization tailored to any job description.
              ATS-friendly PDFs in minutes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-3 font-medium">Product</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#generator" className="hover:text-foreground">
                    Generator
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-medium">Company</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <span className="cursor-default">About</span>
                </li>
                <li>
                  <span className="cursor-default">Contact</span>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="mb-3 font-medium">Legal</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <span className="cursor-default">Privacy</span>
                </li>
                <li>
                  <span className="cursor-default">Terms</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ResumeBoost. Phase 1 UI preview — backend
          coming soon.
        </p>
      </div>
    </footer>
  );
}

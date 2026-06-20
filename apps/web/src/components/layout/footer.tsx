import Link from "next/link";
import { Logo } from "@/components/logo";
import { FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/[0.08] relative overflow-hidden">
      {/* Extremely subtle blue ambient fog near bottom corners */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-500/[0.01] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/[0.01] blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 relative z-10">
        <div className="flex flex-col gap-12 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4 text-left">
            <Logo size="md" />
            
            <p className="max-w-xs text-sm text-white/40 leading-relaxed">
              AI-powered resume optimization tailored to any job description.
              ATS-friendly PDFs in minutes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 text-left">
            <div>
              <p className="mb-4 font-medium text-white/80">Product</p>
              <ul className="space-y-3 text-white/40">
                <li>
                  <a href="#features" className="hover:text-white hover:translate-x-0.5 inline-block transition-all duration-300">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#generator" className="hover:text-white hover:translate-x-0.5 inline-block transition-all duration-300">
                    Generator
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-4 font-medium text-white/80">Company</p>
              <ul className="space-y-3 text-white/40">
                <li>
                  <span className="cursor-default hover:text-white transition-colors duration-300">About</span>
                </li>
                <li>
                  <span className="cursor-default hover:text-white transition-colors duration-300">Contact</span>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="mb-4 font-medium text-white/80">Legal</p>
              <ul className="space-y-3 text-white/40">
                <li>
                  <span className="cursor-default hover:text-white transition-colors duration-300">Privacy</span>
                </li>
                <li>
                  <span className="cursor-default hover:text-white transition-colors duration-300">Terms</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-16 border-t border-white/[0.08] pt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} ResumeBoost. Phase 1 UI preview — backend
          coming soon.
        </p>
      </div>
    </footer>
  );
}

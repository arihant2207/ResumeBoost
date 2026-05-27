import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="size-5" aria-hidden />
          </span>
          <span className="text-lg tracking-tight">
            Resume<span className="text-primary">Boost</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#generator" className="transition-colors hover:text-foreground">
            Try it
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="#generator">Sign in</Link>
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="#generator">
              <Sparkles className="size-4" aria-hidden />
              Get started
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  buttonHoverVariant,
  buttonTapVariant,
  buttonTransition,
} from "@/components/motion/fade-in";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md transition-shadow duration-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark logo — no icon at this scale */}
        <Logo size="md" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a
            href="#features"
            className="transition-colors duration-200 hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="transition-colors duration-200 hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#generator"
            className="transition-colors duration-200 hover:text-foreground"
          >
            Try it
          </a>
        </nav>

        {/* CTA buttons */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={buttonHoverVariant}
            whileTap={buttonTapVariant}
            transition={buttonTransition}
          >
            <Button
              variant="ghost"
              size="sm"
              className="hidden transition-colors duration-200 sm:inline-flex"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </motion.div>

          <motion.div
            whileHover={buttonHoverVariant}
            whileTap={buttonTapVariant}
            transition={buttonTransition}
          >
            {/* No icon — editorial restraint */}
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
}

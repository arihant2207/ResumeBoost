import type { Metadata } from "next";
import {
  Inter,
  Fraunces,
  JetBrains_Mono,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";

/** Body sans-serif — Inter: clean, neutral, high readability */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Primary display serif — Cormorant Garamond.
 * Ultra-refined thin-to-thick stroke contrast. Used for H1/H2,
 * the wordmark logo, and any place the design calls for editorial luxury.
 */
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

/**
 * Fallback display serif — Fraunces (variable font).
 * Kept loaded for potential use in editorial body sections.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Monospace — JetBrains Mono.
 * Used for numeric data: ATS scores, stat callouts, precision numbers.
 */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeBoost — AI Resume Optimization for ATS",
  description:
    "Upload your resume, paste a job description, and get an ATS-optimized PDF tailored to the role in minutes.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${cormorantGaramond.variable} ${fraunces.variable} ${jetbrainsMono.variable} min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

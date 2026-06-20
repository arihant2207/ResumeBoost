/**
 * ResumeBoost logo system.
 *
 * <Logo /> — Wordmark: "Resume" in Cormorant Garamond serif semi-bold + "Boost" in
 *            Cormorant Garamond serif semi-bold.
 */

import Link from "next/link";

const sizeMap = {
  sm: "text-[1.125rem]",
  md: "text-[1.25rem]",
  lg: "text-[1.75rem]",
  xl: "text-[2.25rem]",
} as const;

type LogoSize = keyof typeof sizeMap;

interface LogoProps {
  href?: string;
  size?: LogoSize;
  className?: string;
}

export function Logo({ href = "/", size = "md", className }: LogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-baseline gap-0 leading-none ${className ?? ""}`}
      aria-label="ResumeBoost home"
    >
      <span
        className={`font-serif font-semibold tracking-tight text-white ${sizeMap[size]}`}
        style={{ letterSpacing: "-0.01em" }}
      >
        Resume
      </span>
      <span
        className={`font-serif font-semibold tracking-tight ${sizeMap[size]}`}
        style={{ color: "#6EA8FF", letterSpacing: "-0.01em" }}
      >
        Boost
      </span>
    </Link>
  );
}

interface LogoMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

export function LogoMark({
  size = 20,
  color = "currentColor",
  className,
}: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M 3,11 L 7.5,15 L 17,5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

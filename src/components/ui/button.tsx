import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const styles = {
  primary: "bg-white text-black hover:bg-zinc-200",
  secondary: "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]",
  ghost: "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
};

export function Button({
  href,
  children,
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  children: ReactNode;
  variant?: keyof typeof styles;
}) {
  const classes = cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
    styles[variant],
    className,
  );
  return href ? (
    <Link className={classes} href={href}>
      {children}
    </Link>
  ) : (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

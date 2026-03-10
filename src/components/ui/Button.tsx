import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
};

const base =
  "inline-flex items-center justify-center rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-iaa-blue text-white shadow-soft hover:bg-iaa-blue2 focus:ring-iaa-gold focus:ring-offset-iaa-bg",
  secondary:
    "bg-white text-iaa-blue border border-iaa-blue/20 hover:border-iaa-blue/40 hover:bg-white focus:ring-iaa-gold focus:ring-offset-iaa-bg",
  ghost: "bg-transparent text-iaa-blue hover:bg-iaa-blue/5 focus:ring-iaa-gold focus:ring-offset-iaa-bg",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300 focus:ring-offset-iaa-bg"
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  md: "h-12 px-5 text-base md:h-12",
  lg: "h-14 px-6 text-lg md:h-14"
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return <button className={[base, variants[variant], sizes[size], className].join(" ")} {...props} />;
}


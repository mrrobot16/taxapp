import type { ReactNode } from "react";

type As = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "label" | "div";
type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
type Weight = "normal" | "medium" | "semibold" | "bold";
type Color = "default" | "muted" | "faint" | "accent" | "white";

interface TextProps {
  children: ReactNode;
  as?: As;
  size?: Size;
  weight?: Weight;
  color?: Color;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  "xs":   "text-xs",
  "sm":   "text-sm",
  "base": "text-base",
  "lg":   "text-lg",
  "xl":   "text-xl",
  "2xl":  "text-2xl",
};

const weightClasses: Record<Weight, string> = {
  normal:   "font-normal",
  medium:   "font-medium",
  semibold: "font-semibold",
  bold:     "font-bold",
};

const colorClasses: Record<Color, string> = {
  default: "text-rh-warm-white",
  muted:   "text-rh-warm-gray",
  faint:   "text-rh-cool-gray",
  accent:  "text-rh-lime",
  white:   "text-rh-white",
};

export default function Text({
  children,
  as: Tag = "p",
  size = "sm",
  weight = "normal",
  color = "default",
  className = "",
}: TextProps) {
  const Component = Tag;
  return (
    <Component
      className={[
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Component>
  );
}

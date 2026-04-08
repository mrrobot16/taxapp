import type { ReactNode } from "react";

type Variant = "default" | "secondary" | "outline" | "ghost";
type Size = "small" | "medium" | "large" | "icon";
type Justify = "start" | "center" | "end";
type Gap = "none" | "sm" | "md";

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Flex justify-content; defaults to `center`. */
  justify?: Justify;
  /** Gap between flex children; defaults to `none` for `icon`, else `sm`. */
  gap?: Gap;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default:  "bg-rh-lime text-rh-dark hover:opacity-90",
  secondary: "bg-rh-surface-2 border border-rh-border text-rh-warm-white hover:bg-rh-border",
  outline:  "border border-rh-border text-rh-warm-white bg-transparent hover:bg-rh-surface-2",
  ghost:    "text-rh-warm-gray hover:text-rh-white hover:bg-rh-surface-2",
};

const sizeClasses: Record<Size, string> = {
  small:  "h-8  min-h-8  px-3 text-xs  rounded-md",
  medium: "h-10 min-h-10 px-4 text-sm  rounded-lg",
  large:  "h-12 min-h-12 px-6 text-base rounded-xl",
  icon:   "h-10 w-10 min-h-10 min-w-10 shrink-0 p-0 text-sm rounded-lg",
};

const justifyClasses: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

const gapClasses: Record<Gap, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-3",
};

export default function Button({
  children,
  variant = "secondary",
  size = "medium",
  justify,
  gap,
  fullWidth = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
}: ButtonProps) {
  const resolvedJustify = justify ?? "center";
  const resolvedGap = gap ?? (size === "icon" ? "none" : "sm");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center font-medium transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        justifyClasses[resolvedJustify],
        gapClasses[resolvedGap],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

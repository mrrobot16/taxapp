type Size = "small" | "medium" | "large";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  size?: Size;
  label?: string;
  error?: string;
  placeholder?: string;
  autoFocus?: boolean;
  type?: string;
  disabled?: boolean;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  small:  "h-8  px-3 text-xs",
  medium: "h-10 px-3 text-sm",
  large:  "h-12 px-4 text-base",
};

export default function Input({
  value,
  onChange,
  size = "medium",
  label,
  error,
  placeholder,
  autoFocus = false,
  type = "text",
  disabled = false,
  className = "",
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-rh-warm-white">{label}</label>
      )}
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full bg-rh-surface-2 border rounded-[26px] text-rh-white",
          "placeholder-rh-cool-gray",
          "focus:outline-none focus:ring-2 focus:ring-rh-lime focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition",
          error ? "border-red-500" : "border-rh-border",
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  );
}

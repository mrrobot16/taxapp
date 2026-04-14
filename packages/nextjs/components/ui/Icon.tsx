type IconName =
  | "menu"
  | "search"
  | "gear"
  | "close"
  | "send"
  | "chevron-right"
  | "chat"
  | "check"
  | "spinner";

type Size = "sm" | "md" | "lg";

interface IconProps {
  name: IconName;
  size?: Size;
  className?: string;
}

const sizePx: Record<Size, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

// Each entry is the inner SVG content; the wrapper SVG is rendered by the component.
const paths: Record<IconName, { strokeWidth?: number; path: string; fill?: string }> = {
  menu: {
    strokeWidth: 2,
    path: "M4 6h16M4 12h16M4 18h16",
  },
  search: {
    strokeWidth: 2,
    path: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  },
  gear: {
    strokeWidth: 1.75,
    path: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  },
  close: {
    strokeWidth: 2,
    path: "M6 18L18 6M6 6l12 12",
  },
  send: {
    strokeWidth: 2,
    path: "M5 12h14M12 5l7 7-7 7",
  },
  "chevron-right": {
    strokeWidth: 2,
    path: "M9 5l7 7-7 7",
  },
  chat: {
    strokeWidth: 1.5,
    path: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-3 3v-3z",
  },
  check: {
    strokeWidth: 2.5,
    path: "M5 13l4 4L19 7",
  },
  spinner: {
    strokeWidth: 4,
    path: "__spinner__",
  },
};

export default function Icon({ name, size = "md", className = "" }: IconProps) {
  const px = sizePx[size];
  const icon = paths[name];

  if (name === "spinner") {
    return (
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className={`animate-spin ${className}`}
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
    );
  }

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.path.trim().split(" M").map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}

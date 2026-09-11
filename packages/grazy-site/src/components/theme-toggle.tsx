import { useEffect, useState } from "react";

type ThemeMode = "auto" | "dark" | "light";

const themeModes = ["auto", "dark", "light"] as const;

const nextModes: Record<ThemeMode, ThemeMode> = {
  auto: "light",
  dark: "auto",
  light: "dark",
};

const themeLabels: Record<ThemeMode, string> = {
  auto: "Auto",
  dark: "Dark",
  light: "Light",
};

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(
    function syncThemeToDocument() {
      applyThemeMode(mode);
    },
    [mode],
  );

  useEffect(() => {
    if (mode !== "auto") {
      return;
    }

    const media = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeMode("auto");

    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [mode]);

  const toggleMode = () => {
    const nextMode = nextModes[mode];
    setMode(nextMode);
    globalThis.localStorage.setItem("theme", nextMode);
  };

  const label =
    mode === "auto" ?
      "Theme mode: auto (system). Click to switch to light mode."
    : `Theme mode: ${mode}. Click to switch mode.`;

  return (
    <button
      aria-label={label}
      className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
      onClick={toggleMode}
      suppressHydrationWarning
      title={label}
      type="button"
    >
      {themeLabels[mode]}
    </button>
  );
}

function applyThemeMode(mode: ThemeMode) {
  const isPrefersDark = globalThis.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const resolved = resolveTheme(mode, isPrefersDark);

  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);

  if (mode === "auto") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = mode;
  }

  document.documentElement.style.colorScheme = resolved;
}

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "auto";
  }

  const stored = globalThis.localStorage.getItem("theme");
  const mode = themeModes.find((candidate) => candidate === stored);
  return mode ?? "auto";
}

function resolveTheme(
  mode: ThemeMode,
  isPrefersDark: boolean,
): "dark" | "light" {
  if (mode === "auto") {
    return isPrefersDark ? "dark" : "light";
  }

  return mode;
}

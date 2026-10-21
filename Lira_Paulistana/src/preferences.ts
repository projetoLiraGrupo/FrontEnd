// Accessibility & appearance preferences. Choices persist in localStorage; "system" choices follow
// the device media queries. The resolved values are written to <html> as data attributes, which
// src/theme.css turns into one of four palettes: light, dark, light high contrast, dark high contrast.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"

export type ThemeChoice = "system" | "light" | "dark"
export type ContrastChoice = "system" | "standard" | "high"
export type MotionChoice = "system" | "reduce" | "full"
export type Preferences = {
  theme: ThemeChoice
  contrast: ContrastChoice
  motion: MotionChoice
  textScale: number
}
export type SystemPreferences = {
  dark: boolean
  highContrast: boolean
  reducedMotion: boolean
}
export type ResolvedPreferences = {
  theme: "light" | "dark"
  contrast: "standard" | "high"
  motion: "reduce" | "full"
  textScale: number
}

export const textScales = [90, 100, 110, 120, 130]
export const defaultPreferences: Preferences = {
  theme: "system",
  contrast: "system",
  motion: "system",
  textScale: 100,
}

const storageKey = "lira-a11y-preferences"
const queries = {
  dark: "(prefers-color-scheme: dark)",
  highContrast: "(prefers-contrast: more), (forced-colors: active)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? value as T : fallback
}

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    ) as Partial<Preferences> | null
    if (!saved || typeof saved !== "object") return defaultPreferences
    return {
      theme: oneOf(saved.theme, ["system", "light", "dark"], "system"),
      contrast: oneOf(saved.contrast, ["system", "standard", "high"], "system"),
      motion: oneOf(saved.motion, ["system", "reduce", "full"], "system"),
      textScale: textScales.includes(saved.textScale as number)
        ? saved.textScale as number
        : 100,
    }
  } catch {
    return defaultPreferences
  }
}

export function savePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    /* storage unavailable: keep in memory */
  }
}

type PreferenceKey = keyof Preferences

export function isDefault(preferences: Preferences) {
  return (Object.keys(defaultPreferences) as PreferenceKey[]).every(
    (key) => preferences[key] === defaultPreferences[key],
  )
}

const canMatch = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
const matches = (query: string) =>
  canMatch() && window.matchMedia(query).matches
const serverSnapshot: SystemPreferences = {
  dark: false,
  highContrast: false,
  reducedMotion: false,
}
let systemSnapshot: SystemPreferences | undefined

// Stable snapshot for useSyncExternalStore: a new object only when a media query actually changed.
export function getSystemPreferences(): SystemPreferences {
  const next = {
    dark: matches(queries.dark),
    highContrast: matches(queries.highContrast),
    reducedMotion: matches(queries.reducedMotion),
  }
  const same =
    systemSnapshot &&
    systemSnapshot.dark === next.dark &&
    systemSnapshot.highContrast === next.highContrast &&
    systemSnapshot.reducedMotion === next.reducedMotion
  if (!same) systemSnapshot = next
  return systemSnapshot!
}

export function subscribeSystemPreferences(onChange: () => void) {
  if (!canMatch()) return () => {}
  const lists = Object.values(queries).map((query) => window.matchMedia(query))
  // Safari < 14 only implements the deprecated addListener/removeListener API.
  lists.forEach((list) =>
    list.addEventListener
      ? list.addEventListener("change", onChange)
      : list.addListener(onChange),
  )
  return () =>
    lists.forEach((list) =>
      list.removeEventListener
        ? list.removeEventListener("change", onChange)
        : list.removeListener(onChange),
    )
}

export function resolvePreferences(
  preferences: Preferences,
  system = getSystemPreferences(),
): ResolvedPreferences {
  return {
    theme:
      preferences.theme === "system"
        ? system.dark
          ? "dark"
          : "light"
        : preferences.theme,
    contrast:
      preferences.contrast === "system"
        ? system.highContrast
          ? "high"
          : "standard"
        : preferences.contrast,
    motion:
      preferences.motion === "system"
        ? system.reducedMotion
          ? "reduce"
          : "full"
        : preferences.motion,
    textScale: preferences.textScale,
  }
}

export function applyPreferences(resolved: ResolvedPreferences) {
  const root = document.documentElement
  root.dataset.theme = resolved.theme
  root.dataset.contrast = resolved.contrast
  root.dataset.motion = resolved.motion
  root.style.setProperty("--font-scale", String(resolved.textScale / 100))
}

// Owns the saved choices, follows live system changes and other tabs, and keeps <html> in sync.
export function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences)
  const system = useSyncExternalStore(
    subscribeSystemPreferences,
    getSystemPreferences,
    () => serverSnapshot,
  )
  const resolved = useMemo(
    () => resolvePreferences(preferences, system),
    [preferences, system],
  )

  useLayoutEffect(() => applyPreferences(resolved), [resolved])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        setPreferences(readPreferences())
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  const update = useCallback((change: Partial<Preferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...change }
      savePreferences(next)
      return next
    })
  }, [])
  const reset = useCallback(() => update(defaultPreferences), [update])

  return { preferences, system, resolved, update, reset }
}

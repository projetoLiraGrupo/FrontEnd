import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type PointerEvent,
} from "react"
import { Icon, PrimaryButton } from "./UI"
import {
  isDefault,
  textScales,
  type ContrastChoice,
  type MotionChoice,
  type Preferences,
  type ResolvedPreferences,
  type SystemPreferences,
  type ThemeChoice,
} from "../preferences"

type Props = {
  open: boolean
  onClose: () => void
  preferences: Preferences
  resolved: ResolvedPreferences
  system: SystemPreferences
  onChange: (change: Partial<Preferences>) => void
  onReset: () => void
}

type Option<T,> = {
  value: T
  label: string
}
type ThemeOption = Option<ThemeChoice> & { icon: string }
const themeOptions: ThemeOption[] = [
  { value: "system", label: "Sistema", icon: "monitor" },
  { value: "light", label: "Claro", icon: "sun" },
  { value: "dark", label: "Escuro", icon: "moon" },
]
const contrastOptions: Option<ContrastChoice>[] = [
  { value: "system", label: "Sistema" },
  { value: "standard", label: "Padrão" },
  { value: "high", label: "Alto" },
]
const motionOptions: Option<MotionChoice>[] = [
  { value: "system", label: "Sistema" },
  { value: "reduce", label: "Reduzido" },
  { value: "full", label: "Completo" },
]

// Miniature of the page in a given palette; "system" previews show both sides split diagonally.
function Swatch({
  theme,
  contrast,
}: {
  theme: "light" | "dark" | "split"
  contrast: "standard" | "high" | "split"
}) {
  const face = (t: "light" | "dark", c: "standard" | "high", split = false) => (
    <span
      className={`pref-swatch-face${split ? " pref-swatch-face--split" : ""}`}
      data-swatch-theme={t}
      data-swatch-contrast={c}
    >
      <span />
    </span>
  )
  return (
    <span className="pref-swatch" aria-hidden="true">
      {theme === "split" ? (
        <>
          {face("light", contrast === "split" ? "standard" : contrast)}
          {face("dark", contrast === "split" ? "standard" : contrast, true)}
        </>
      ) : contrast === "split" ? (
        <>
          {face(theme, "standard")}
          {face(theme, "high", true)}
        </>
      ) : (
        face(theme, contrast)
      )}
    </span>
  )
}

export default function AccessibilityDialog({
  open,
  onClose,
  preferences,
  resolved,
  system,
  onChange,
  onReset,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const pressedBackdrop = useRef(false)
  const id = useId()

  // Keep the native modal in sync with React state. showModal() traps focus, makes the page inert and handles Escape.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      dialog.showModal()
    } else if (!open && dialog.open) dialog.close()
  }, [open])

  // Stop the page behind from scrolling while the dialog is open.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = "hidden"
    return () => {
      root.style.overflow = previous
    }
  }, [open])

  // Fires for Escape, the close buttons and backdrop clicks alike.
  const handleClose = () => {
    onClose()
    const opener = openerRef.current
    // The opener may have been hidden meanwhile (e.g. inside the collapsed mobile menu); fall back to the main content.
    const target =
      opener?.isConnected && opener.getClientRects().length > 0
        ? opener
        : document.getElementById("main")
    if (target) {
      if (target === opener) target.focus()
      else {
        target.setAttribute("tabindex", "-1")
        target.focus({ preventScroll: true })
      }
    }
    openerRef.current = null
  }

  // Only a press that both starts and ends on the backdrop closes the dialog (not a text selection dragged outside).
  const onPointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    pressedBackdrop.current = event.target === event.currentTarget
  }
  const onClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (pressedBackdrop.current && event.target === event.currentTarget)
      dialogRef.current?.close()
    pressedBackdrop.current = false
  }

  const scaleIndex = textScales.indexOf(preferences.textScale)
  const atMin = scaleIndex <= 0
  const atMax = scaleIndex >= textScales.length - 1
  const step = (direction: -1 | 1) => {
    const next = textScales[scaleIndex + direction]
    if (next !== undefined) onChange({ textScale: next })
  }
  const defaults = isDefault(preferences)

  const dark = resolved.theme === "dark"
  const high = resolved.contrast === "high"
  const status = `Tema ${dark ? "escuro" : "claro"}${
    preferences.theme === "system" ? " (do sistema)" : ""
  }, contraste ${high ? "alto" : "padrão"}${
    preferences.contrast === "system" ? " (do sistema)" : ""
  }, movimento ${resolved.motion === "reduce" ? "reduzido" : "completo"}${
    preferences.motion === "system" ? " (do sistema)" : ""
  }, texto em ${resolved.textScale}%.`

  return (
    <dialog
      ref={dialogRef}
      className="access-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-intro`}
      onClose={handleClose}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <div className="access-modal">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Personalize sua experiência</p>
            <h2 id={`${id}-title`}>Acessibilidade e aparência</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar preferências de acessibilidade"
          >
            <Icon name="x" />
          </button>
        </div>
        <p id={`${id}-intro`} className="access-intro">
          As escolhas são salvas neste navegador. “Sistema” acompanha as
          configurações do seu dispositivo.
        </p>
        <p className="access-status" role="status" aria-live="polite">
          <strong>Ativo agora:</strong> {status}
        </p>

        <fieldset className="pref-group">
          <legend>Tema</legend>
          <div className="pref-options">
            {themeOptions.map((option) => (
              <label key={option.value} className="pref-option">
                <input
                  type="radio"
                  name={`${id}-theme`}
                  value={option.value}
                  checked={preferences.theme === option.value}
                  onChange={() => onChange({ theme: option.value })}
                />
                <span className="pref-option-face">
                  <Swatch
                    theme={option.value === "system" ? "split" : option.value}
                    contrast={resolved.contrast}
                  />
                  <span className="pref-option-label">
                    <Icon name={option.icon} size={15} />
                    {option.label}
                  </span>
                  <span className="pref-check" aria-hidden="true">
                    <Icon name="check" size={11} />
                  </span>
                </span>
              </label>
            ))}
          </div>
          {preferences.theme === "system" && (
            <p className="pref-hint">
              Seu dispositivo está usando o modo{" "}
              {system.dark ? "escuro" : "claro"}.
            </p>
          )}
        </fieldset>

        <fieldset className="pref-group">
          <legend>Contraste</legend>
          <div className="pref-options">
            {contrastOptions.map((option) => (
              <label key={option.value} className="pref-option">
                <input
                  type="radio"
                  name={`${id}-contrast`}
                  value={option.value}
                  checked={preferences.contrast === option.value}
                  onChange={() => onChange({ contrast: option.value })}
                />
                <span className="pref-option-face">
                  <Swatch
                    theme={resolved.theme}
                    contrast={
                      option.value === "system" ? "split" : option.value
                    }
                  />
                  <span className="pref-option-label">
                    {option.value === "high" && (
                      <Icon name="contrast" size={15} />
                    )}
                    {option.label}
                  </span>
                  <span className="pref-check" aria-hidden="true">
                    <Icon name="check" size={11} />
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="pref-hint">
            {preferences.contrast === "system"
              ? `Seu dispositivo ${
                  system.highContrast ? "pede" : "não pede"
                } contraste maior.`
              : "Alto contraste reforça textos, bordas, links e o foco do teclado."}
          </p>
        </fieldset>

        <fieldset className="pref-group">
          <legend>Movimento</legend>
          <div className="pref-segments">
            {motionOptions.map((option) => (
              <label key={option.value} className="pref-segment">
                <input
                  type="radio"
                  name={`${id}-motion`}
                  value={option.value}
                  checked={preferences.motion === option.value}
                  onChange={() => onChange({ motion: option.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <p className="pref-hint">
            {preferences.motion === "system"
              ? `Seu dispositivo ${
                  system.reducedMotion ? "pede" : "não pede"
                } menos movimento.`
              : "Reduzido pausa animações, transições e o fundo que segue o cursor."}
          </p>
        </fieldset>

        <div
          className="pref-group"
          role="group"
          aria-labelledby={`${id}-scale`}
        >
          <p id={`${id}-scale`} className="pref-group-title">
            Tamanho do texto
          </p>
          <div className="pref-scale">
            <span className="pref-scale-track" aria-hidden="true">
              {textScales.map((value) => (
                <i
                  key={value}
                  className={value <= preferences.textScale ? "is-on" : ""}
                />
              ))}
            </span>
            <div className="pref-stepper">
              <button
                type="button"
                className="pref-step"
                aria-label={
                  atMin
                    ? `Diminuir texto (mínimo de ${textScales[0]}% atingido)`
                    : "Diminuir texto"
                }
                aria-disabled={atMin}
                onClick={() => step(-1)}
              >
                A−
              </button>
              <output className="pref-scale-value" aria-live="off">
                {preferences.textScale}%
              </output>
              <button
                type="button"
                className="pref-step"
                aria-label={
                  atMax
                    ? `Aumentar texto (máximo de ${textScales[textScales.length - 1]}% atingido)`
                    : "Aumentar texto"
                }
                aria-disabled={atMax}
                onClick={() => step(1)}
              >
                A+
              </button>
            </div>
          </div>
          <p className="pref-hint">
            De {textScales[0]}% a {textScales[textScales.length - 1]}%, em
            passos de 10%.
          </p>
        </div>

        <div className="access-actions">
          <button
            type="button"
            className="access-reset"
            aria-disabled={defaults}
            onClick={() => {
              if (!defaults) onReset()
            }}
          >
            <Icon name="reset" size={16} /> Restaurar padrões
          </button>
          <PrimaryButton onClick={() => dialogRef.current?.close()}>
            Concluir <Icon name="check" size={18} />
          </PrimaryButton>
        </div>
      </div>
    </dialog>
  )
}

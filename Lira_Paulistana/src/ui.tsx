import type { ReactNode, ButtonHTMLAttributes, ChangeEvent } from "react"
import { useId } from "react"

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost"
}
export function Button({
  variant = "secondary",
  className = "",
  ...p
}: BtnProps) {
  const v = {
    primary:
      "bg-brand text-on-brand border-brand hover:bg-brand-hover hover:border-brand-hover",
    secondary: "bg-paper text-ink border-line hover:border-ink",
    ghost: "bg-transparent text-ink border-transparent hover:bg-sand",
  }[variant]
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${v} ${className}`}
    />
  )
}

export function Card({
  children,
  className = "",
  tone = "white",
}: {
  children: ReactNode
  className?: string
  tone?: "white" | "sand" | "brand"
}) {
  const t = {
    white: "bg-paper border-line",
    sand: "bg-sand border-line",
    brand: "bg-brand-soft border-brand/20",
  }[tone]
  return (
    <div className={`surface-card rounded-2xl border p-6 ${t} ${className}`}>
      {children}
    </div>
  )
}

type H1Props = {
  children: ReactNode
  sub?: ReactNode
}
export function H1({ children, sub }: H1Props) {
  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
        {children}
      </h1>
      {sub && <p className="mt-2 text-muted">{sub}</p>}
    </div>
  )
}
export function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-xl font-semibold">{children}</h2>
}

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"

type FieldProps = {
  label: string
  required?: boolean
  placeholder?: string
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  type?: string
  min?: number
  max?: number
  options?: string[]
  textarea?: boolean
  rows?: number
  className?: string
}
export function Field({
  label,
  required,
  options,
  textarea,
  rows = 3,
  className = "",
  onValueChange,
  ...p
}: FieldProps) {
  const id = useId()
  const onChange =
    onValueChange &&
    ((
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => onValueChange(e.target.value))
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}{" "}
        {required && (
          <span className="text-accent" aria-hidden>
            *
          </span>
        )}
      </label>
      {options ? (
        <select
          id={id}
          required={required}
          defaultValue={p.defaultValue}
          value={p.value}
          onChange={onChange}
          className={inputCls}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          id={id}
          required={required}
          rows={rows}
          {...p}
          onChange={onChange}
          className={inputCls}
        />
      ) : (
        <input
          id={id}
          required={required}
          {...p}
          onChange={onChange}
          className={inputCls}
        />
      )}
    </div>
  )
}

const statusTone: Record<string, string> = {
  Confirmada: "bg-brand-soft text-brand-ink",
  Verificado: "bg-brand-soft text-brand-ink",
  Publicado: "bg-brand-soft text-brand-ink",
  Pendente: "bg-warning-soft text-warning",
  "Aguardando confirmação": "bg-warning-soft text-warning",
  Rascunho: "bg-sand text-muted",
  "Não autorizado": "bg-negative-soft text-negative",
}
export function Badge({ children }: { children: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[children] ?? "bg-sand text-ink"}`}
    >
      {children}
    </span>
  )
}

type TableProps = {
  head: string[]
  rows: ReactNode[][]
}
export function Table({ head, rows }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
      <table className="w-full text-left text-sm">
        <thead className="bg-sand">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3.5">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { useId, useState, type ReactNode } from "react"
import { Icon, PageIntro, Panel, Pill } from "../../../components/UI"
import type { Go } from "../../../data/mock"
import { fmtDay, iso } from "./dates"
import {
  INGRESSO_LABEL,
  PERIOD_LABEL,
  SITUACAO_LABEL,
  granularity,
  rangeLabel,
  type Ctx,
  type Status,
} from "./metrics"
import { actions, DEFAULT_FILTERS } from "./store"
import { Legend, Sparkline } from "./charts"
import type { Filters } from "./types"
import "./analytics.css"

export function AnalyticsFrame({
  ctx,
  go,
  eyebrow,
  title,
  desc,
  right,
  children,
}: {
  ctx: Ctx
  go: Go
  eyebrow: string
  title: string
  desc: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} desc={desc} right={right} />
      <SourceBanner ctx={ctx} go={go} />
      <FilterBar ctx={ctx} />
      <div className="dash-stack">{children}</div>
    </>
  )
}

export function DetailStats({ items }: { items: [string, string][] }) {
  return (
    <div className="detail-stats">
      {items.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  )
}

export function InfoTip({
  children,
  label = "Como este indicador é calculado",
}: {
  children: ReactNode
  label?: string
}) {
  const id = useId()
  return (
    <span className="info-tip">
      <button
        type="button"
        className="info-tip-button"
        aria-label={label}
        aria-describedby={id}
      >
        <Icon name="info" size={15} />
      </button>
      <span role="tooltip" id={id} className="info-tip-body">
        {children}
      </span>
    </span>
  )
}

type SourceBannerProps = {
  ctx: Ctx
  go: Go
}
export function SourceBanner({ ctx, go }: SourceBannerProps) {
  const demo = ctx.ds.origin === "demo"
  return (
    <div
      className={`source-banner ${demo ? "source-banner--demo" : ""}`}
      role="note"
    >
      <Icon name={demo ? "alert" : "database"} size={18} />
      <p>
        {demo ? (
          <>
            <strong>Dados de demonstração.</strong> Números simulados para
            apresentar a dashboard; não representam alunos reais e nunca são
            misturados aos dados importados.
          </>
        ) : (
          <>
            <strong>Dados importados</strong> em{" "}
            {fmtDay(Math.floor(Date.parse(ctx.ds.loadedAt) / 86400000))},
            processados somente neste navegador · fontes:{" "}
            {ctx.ds.available.map((k) => `${k}.csv`).join(", ")}.
          </>
        )}
      </p>
      <button
        type="button"
        className="card-link"
        onClick={() => go("/admin/dados")}
      >
        {demo ? "Importar CSV" : "Gerenciar dados"}{" "}
        <Icon name="arrow" size={15} />
      </button>
    </div>
  )
}

const PERIODS: Filters["period"][] = ["7d", "30d", "90d", "12m", "custom"]
export function FilterBar({ ctx }: { ctx: Ctx }) {
  const f = ctx.f
  const [open, setOpen] = useState(false)
  const active = (Object.keys(DEFAULT_FILTERS) as Array<keyof Filters>).filter(
    (k) =>
      k !== "period" &&
      k !== "from" &&
      k !== "to" &&
      f[k] !== DEFAULT_FILTERS[k],
  ).length
  const select = <K extends keyof Filters,>(
    key: K,
    label: string,
    options: [string, string][],
  ) => (
    <label className="filter-field">
      <span>{label}</span>
      <select
        value={f[key]}
        onChange={(e) =>
          actions.setFilters({ [key]: e.target.value } as Partial<Filters>)
        }
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
  return (
    <section className="filter-bar" aria-label="Filtros globais da dashboard">
      <div className="filter-bar-top">
        <div className="segmented" role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={f.period === p}
              className={f.period === p ? "is-active" : ""}
              onClick={() =>
                actions.setFilters(
                  p === "custom" && !f.from
                    ? {
                        period: p,
                        from: iso(ctx.range.start),
                        to: iso(ctx.range.end),
                      }
                    : { period: p },
                )
              }
            >
              {p === "custom"
                ? "Personalizado"
                : p === "12m"
                  ? "12 meses"
                  : p.replace("d", " dias")}
            </button>
          ))}
        </div>
        {f.period === "custom" && (
          <div className="filter-dates">
            <label className="filter-field">
              <span>De</span>
              <input
                type="date"
                value={f.from}
                max={f.to || undefined}
                onChange={(e) => actions.setFilters({ from: e.target.value })}
              />
            </label>
            <label className="filter-field">
              <span>Até</span>
              <input
                type="date"
                value={f.to}
                min={f.from || undefined}
                max={iso(ctx.ref)}
                onChange={(e) => actions.setFilters({ to: e.target.value })}
              />
            </label>
          </div>
        )}
        <button
          type="button"
          className={`filter-toggle ${open ? "is-open" : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name="filter" size={16} /> Mais filtros
          {active > 0 && <span className="filter-count">{active}</span>}
        </button>
      </div>
      {open && (
        <div className="filter-grid">
          {select("regiao", "Região", [
            ["", "Todas as regiões"],
            ...ctx.options.regioes.map((r) => [r, r] as [string, string]),
          ])}
          {select("professor", "Professor", [
            ["", "Todos os professores"],
            ...ctx.options.professores.map((r) => [r, r] as [string, string]),
          ])}
          {select("modalidade", "Experiência / modalidade", [
            ["", "Todas as modalidades"],
            ...ctx.options.modalidades.map((r) => [r, r] as [string, string]),
          ])}
          {select(
            "situacao",
            "Situação do aluno",
            Object.entries(SITUACAO_LABEL),
          )}
          {select(
            "ingresso",
            "Faixa de ingresso",
            Object.entries(INGRESSO_LABEL),
          )}
          <button
            type="button"
            className="filter-clear"
            onClick={actions.resetFilters}
          >
            <Icon name="reset" size={15} /> Limpar filtros
          </button>
        </div>
      )}
      <p className="filter-summary" aria-live="polite">
        <strong>{PERIOD_LABEL[f.period]}</strong> · {rangeLabel(ctx.range)} ·
        comparado a {rangeLabel(ctx.prev)} · agrupado por{" "}
        {granularity(ctx.range)}
        {active > 0 && (
          <>
            {" "}
            ·{" "}
            {[
              f.regiao,
              f.professor,
              f.modalidade,
              f.situacao !== "todos" ? SITUACAO_LABEL[f.situacao] : "",
              f.ingresso !== "todas" ? INGRESSO_LABEL[f.ingresso] : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </>
        )}
      </p>
      {f.situacao !== "todos" && (
        <p className="filter-warning">
          <Icon name="alert" size={15} /> O filtro de situação restringe a base:
          taxas de retenção e desistência deixam de representar a escola como um
          todo.
        </p>
      )}
    </section>
  )
}

export function Unavailable({
  status,
  need,
  compact = false,
}: {
  status: Status
  need?: string
  compact?: boolean
}) {
  if (status === "ok") return null
  return (
    <div className={`unavailable ${compact ? "unavailable--compact" : ""}`}>
      <Icon name={status === "indisponivel" ? "database" : "info"} size={18} />
      <div>
        <strong>
          {status === "indisponivel" ? "Não disponível" : "Dados insuficientes"}
        </strong>
        <p>
          {status === "indisponivel"
            ? `Para calcular, importe: ${need}.`
            : "Não há registros suficientes no período e filtros selecionados. Experimente ampliar o período."}
        </p>
      </div>
    </div>
  )
}

export type DeltaSpec = {
  current: number | null
  previous: number | null
  kind: "rate" | "count" | "score"
  better: "up" | "down"
}
export function Delta({ current, previous, kind, better }: DeltaSpec) {
  if (current === null || previous === null)
    return <span className="delta delta--none">Sem base de comparação</span>
  const diff = current - previous
  const rel = previous !== 0 ? diff / Math.abs(previous) : null
  const dir = Math.abs(diff) < 1e-9 ? "flat" : diff > 0 ? "up" : "down"
  const good = dir === "flat" ? "flat" : dir === better ? "good" : "bad"
  const fmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: kind === "count" ? 0 : kind === "score" ? 2 : 1,
  })
  const abs =
    kind === "rate"
      ? `${diff > 0 ? "+" : ""}${fmt.format(diff * 100)} p.p.`
      : `${diff > 0 ? "+" : ""}${fmt.format(diff)}`
  const arrow = dir === "flat" ? "→" : dir === "up" ? "↑" : "↓"
  return (
    <span className={`delta delta--${good}`}>
      <span aria-hidden="true">{arrow}</span>
      <span className="sr-only">
        {dir === "flat"
          ? "Estável"
          : dir === "up"
            ? "Aumento de"
            : "Redução de"}
      </span>{" "}
      {abs}
      {rel !== null && ` (${diff > 0 ? "+" : ""}${fmt.format(rel * 100)}%)`}
    </span>
  )
}

export function KpiCard({
  label,
  icon,
  value,
  status,
  need,
  detail,
  delta,
  formula,
  unit,
  period,
  trend,
  goal,
  onOpen,
}: {
  label: string
  icon: string
  value: string
  status: Status
  need?: string
  detail?: string
  delta?: DeltaSpec
  formula: string
  unit: string
  period: string
  trend?: (number | null)[]
  goal?: {
    text: string
    met: boolean | null
  }
  onOpen?: () => void
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-head">
        <span className="stat-icon">
          <Icon name={icon} size={18} />
        </span>
        <h3>{label}</h3>
        <InfoTip label={`Como “${label}” é calculado`}>
          <strong>{label}</strong>
          <span>
            <b>Fórmula:</b> {formula}
          </span>
          <span>
            <b>Unidade:</b> {unit}
          </span>
          <span>
            <b>Período:</b> {period}
          </span>
        </InfoTip>
      </div>
      {status === "ok" ? (
        <>
          <div className="kpi-value">
            <strong>{value}</strong>
            {trend && <Sparkline values={trend} />}
          </div>
          {detail && <p className="kpi-detail">{detail}</p>}
          <div className="kpi-foot">
            {delta && <Delta {...delta} />}
            {goal && (
              <Pill
                tone={
                  goal.met === null
                    ? "neutral"
                    : goal.met
                      ? "positive"
                      : "warning"
                }
              >
                {goal.text}
              </Pill>
            )}
          </div>
        </>
      ) : (
        <div className="kpi-value kpi-value--empty">
          <strong>
            {status === "indisponivel"
              ? "Não disponível"
              : "Dados insuficientes"}
          </strong>
          <p className="kpi-detail">
            {status === "indisponivel"
              ? `Requer ${need}`
              : "Sem registros no período"}
          </p>
        </div>
      )}
      {onOpen && (
        <button type="button" className="kpi-open" onClick={onOpen}>
          Ver análise <Icon name="arrow" size={15} />
          <span className="sr-only"> de {label}</span>
        </button>
      )}
    </article>
  )
}

export function ChartCard({
  eyebrow,
  title,
  desc,
  meta,
  legend,
  status = "ok",
  need,
  note,
  actions: right,
  children,
  className = "",
}: {
  eyebrow?: string
  title: string
  desc?: string
  meta?: string[]
  legend?: {
    label: string
    color: string
    hollow?: boolean
  }[]
  status?: Status
  need?: string
  note?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Panel className={`chart-card ${className}`}>
      <div className="chart-card-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {desc && <p className="chart-card-desc">{desc}</p>}
        </div>
        {right}
      </div>
      {meta && meta.length > 0 && (
        <div className="chart-meta">
          {meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      )}
      {status === "ok" ? (
        <>
          {legend && <Legend items={legend} />}
          {children}
        </>
      ) : (
        <Unavailable status={status} need={need} />
      )}
      {note && <p className="chart-note">{note}</p>}
    </Panel>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: [T, string][]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="segmented segmented--small" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          className={value === v ? "is-active" : ""}
          onClick={() => onChange(v)}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

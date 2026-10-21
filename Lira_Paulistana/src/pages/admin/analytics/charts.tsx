import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from "react"

export const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
]

type TipState = {
  x: number
  y: number
  title: string
  lines: string[]
} | null
/** Shared tooltip: positions above the hovered/focused element, inside the chart box. */
export function useTip() {
  const box = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<TipState>(null)
  const bind = (title: string, lines: string[]) => {
    const show = (e: SyntheticEvent<Element>) => {
      const b = box.current?.getBoundingClientRect()
      if (!b) return
      const r = e.currentTarget.getBoundingClientRect()
      const x = Math.min(
        Math.max(r.left + r.width / 2 - b.left, 100),
        b.width - 100,
      )
      setTip({ x, y: r.top - b.top, title, lines })
    }
    const hide = () => setTip(null)
    return {
      onMouseEnter: show,
      onFocus: show,
      onMouseLeave: hide,
      onBlur: hide,
    }
  }
  const node = tip && (
    <div
      className="chart-tip"
      style={{ left: tip.x, top: tip.y }}
      aria-hidden="true"
    >
      <strong>{tip.title}</strong>
      {tip.lines.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  )
  return { box, bind, node }
}

function useWidth(box: RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(640)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    setW(Math.max(260, el.clientWidth))
    const ro = new ResizeObserver(([entry]) =>
      setW(Math.max(260, Math.round(entry.contentRect.width))),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [box])
  return w
}

export function Legend({
  items,
}: {
  items: {
    label: string
    color: string
    hollow?: boolean
  }[]
}) {
  return (
    <ul className="chart-legend">
      {items.map((i) => (
        <li key={i.label}>
          <span
            className={`chart-swatch ${i.hollow ? "chart-swatch--hollow" : ""}`}
            style={{ ["--swatch" as string]: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

const ticks = (min: number, max: number, n = 4) =>
  Array.from({ length: n + 1 }, (_, i) => min + ((max - min) * i) / n)
const every = (count: number, width: number) =>
  Math.max(1, Math.ceil(count / Math.max(2, Math.floor(width / 64))))

type LineSeries = {
  label: string
  color: string
  values: (number | null)[]
  n?: number[]
  dashed?: boolean
}
export function LineChart({
  labels,
  series,
  min = 0,
  max,
  format,
  height = 240,
  goal,
  selected,
  onSelect,
  ariaLabel,
}: {
  labels: string[]
  series: LineSeries[]
  min?: number
  max?: number
  format: (v: number) => string
  height?: number
  goal?: {
    value: number
    label: string
  }
  selected?: number | null
  onSelect?: (i: number) => void
  ariaLabel: string
}) {
  const { box, bind, node } = useTip()
  const w = useWidth(box)
  const m = { l: 48, r: 14, t: 16, b: 30 }
  const all = series.flatMap((s) =>
    s.values.filter((v): v is number => v !== null),
  )
  const top = max ?? Math.max(1, ...all) * 1.12
  const iw = w - m.l - m.r
  const ih = height - m.t - m.b
  const x = (i: number) =>
    m.l + (labels.length < 2 ? iw / 2 : (iw * i) / (labels.length - 1))
  const y = (v: number) => m.t + ih - ((v - min) / (top - min || 1)) * ih
  const step = every(labels.length, iw)
  const band = labels.length < 2 ? iw : iw / (labels.length - 1)
  return (
    <div className="chart" ref={box}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel}>
        {ticks(min, top).map((t) => (
          <g key={t}>
            <line
              x1={m.l}
              x2={w - m.r}
              y1={y(t)}
              y2={y(t)}
              className="chart-grid"
            />
            <text
              x={m.l - 8}
              y={y(t)}
              className="chart-axis"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {format(t)}
            </text>
          </g>
        ))}
        {goal && goal.value <= top && (
          <g>
            <line
              x1={m.l}
              x2={w - m.r}
              y1={y(goal.value)}
              y2={y(goal.value)}
              className="chart-goal"
            />
            <text
              x={w - m.r}
              y={y(goal.value) - 6}
              className="chart-goal-label"
              textAnchor="end"
            >
              {goal.label}
            </text>
          </g>
        )}
        {selected != null && (
          <rect
            x={x(selected) - band / 2}
            y={m.t}
            width={band}
            height={ih}
            className="chart-selected"
          />
        )}
        {series.map((s) => {
          let d = ""
          let open = false
          s.values.forEach((v, i) => {
            if (v === null) {
              open = false
              return
            }
            d += `${open ? "L" : "M"}${x(i)},${y(v)}`
            open = true
          })
          return (
            <g key={s.label}>
              <path
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={2.4}
                strokeDasharray={s.dashed ? "5 5" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) =>
                v === null ? null : (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(v)}
                    r={labels.length > 30 ? 2 : 3.5}
                    fill="var(--surface)"
                    stroke={s.color}
                    strokeWidth={2}
                  />
                ),
              )}
            </g>
          )
        })}
        {labels.map((l, i) =>
          i % step === 0 || i === labels.length - 1 ? (
            <text
              key={l + i}
              x={x(i)}
              y={height - 8}
              className="chart-axis"
              textAnchor="middle"
            >
              {l}
            </text>
          ) : null,
        )}
        {labels.map((l, i) => {
          const lines = series.map(
            (s) =>
              `${s.label}: ${
                s.values[i] === null
                  ? "dados insuficientes"
                  : format(s.values[i] as number)
              }${s.n ? ` (n = ${s.n[i]})` : ""}`,
          )
          return (
            <rect
              key={`hit${i}`}
              x={x(i) - band / 2}
              y={m.t}
              width={band}
              height={ih}
              className="chart-hit"
              tabIndex={0}
              role={onSelect ? "button" : undefined}
              aria-label={`${l}. ${lines.join(". ")}`}
              onClick={onSelect ? () => onSelect(i) : undefined}
              onKeyDown={(e) => {
                if (onSelect && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault()
                  onSelect(i)
                }
              }}
              {...bind(l, lines)}
            />
          )
        })}
      </svg>
      {node}
    </div>
  )
}

type ColumnSeries = {
  label: string
  color: string
  values: number[]
}
export function ColumnChart({
  labels,
  series,
  stacked = false,
  format,
  height = 240,
  selected,
  onSelect,
  ariaLabel,
  extra,
}: {
  labels: string[]
  series: ColumnSeries[]
  stacked?: boolean
  format: (v: number) => string
  height?: number
  selected?: number | null
  onSelect?: (i: number) => void
  ariaLabel: string
  extra?: (i: number) => string[]
}) {
  const { box, bind, node } = useTip()
  const w = useWidth(box)
  const m = { l: 44, r: 10, t: 14, b: 30 }
  const iw = w - m.l - m.r
  const ih = height - m.t - m.b
  const totals = labels.map((_, i) =>
    stacked
      ? series.reduce((s, x) => s + x.values[i], 0)
      : Math.max(...series.map((x) => x.values[i])),
  )
  const top = Math.max(1, ...totals) * 1.1
  const y = (v: number) => (v / top) * ih
  const slot = iw / Math.max(1, labels.length)
  const bw = Math.min(46, slot * 0.7)
  const step = every(labels.length, iw)
  return (
    <div className="chart" ref={box}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel}>
        {ticks(0, top).map((t) => (
          <g key={t}>
            <line
              x1={m.l}
              x2={w - m.r}
              y1={m.t + ih - y(t)}
              y2={m.t + ih - y(t)}
              className="chart-grid"
            />
            <text
              x={m.l - 8}
              y={m.t + ih - y(t)}
              className="chart-axis"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {format(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) => {
          const cx = m.l + slot * i + slot / 2
          let acc = 0
          const lines = [
            ...series.map((s) => `${s.label}: ${format(s.values[i])}`),
            ...(extra ? extra(i) : []),
          ]
          return (
            <g key={l + i}>
              {selected === i && (
                <rect
                  x={m.l + slot * i}
                  y={m.t}
                  width={slot}
                  height={ih}
                  className="chart-selected"
                />
              )}
              {series.map((s, k) => {
                const h = y(s.values[i])
                const gw = bw / series.length
                const rx = stacked ? cx - bw / 2 : cx - bw / 2 + gw * k
                const ry = stacked ? m.t + ih - acc - h : m.t + ih - h
                acc += stacked ? h : 0
                return (
                  <rect
                    key={s.label}
                    x={rx}
                    y={ry}
                    width={stacked ? bw : gw - 1}
                    height={Math.max(0, h)}
                    fill={s.color}
                    rx={2}
                  />
                )
              })}
              {(i % step === 0 || i === labels.length - 1) && (
                <text
                  x={cx}
                  y={height - 8}
                  className="chart-axis"
                  textAnchor="middle"
                >
                  {l}
                </text>
              )}
              <rect
                x={m.l + slot * i}
                y={m.t}
                width={slot}
                height={ih}
                className="chart-hit"
                tabIndex={0}
                role={onSelect ? "button" : undefined}
                aria-label={`${l}. ${lines.join(". ")}`}
                onClick={onSelect ? () => onSelect(i) : undefined}
                onKeyDown={(e) => {
                  if (onSelect && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    onSelect(i)
                  }
                }}
                {...bind(l, lines)}
              />
            </g>
          )
        })}
      </svg>
      {node}
    </div>
  )
}

export type HBarRow = {
  label: string
  value: number | null
  display: string
  sub?: string
  muted?: boolean
  tip?: string[]
}
export function HBars({
  rows,
  max,
  selected,
  onSelect,
  goal,
  color = "var(--chart-1)",
}: {
  rows: HBarRow[]
  max?: number
  selected?: string
  onSelect?: (label: string) => void
  goal?: {
    value: number
    label: string
  }
  color?: string
}) {
  const { box, bind, node } = useTip()
  const top = max ?? Math.max(1e-9, ...rows.map((r) => r.value ?? 0))
  return (
    <div className="chart hbars" ref={box}>
      {rows.map((r) => {
        const body = (
          <>
            <span className="hbar-label">
              {r.label}
              {r.sub && <small>{r.sub}</small>}
            </span>
            <span className="hbar-track">
              {r.value !== null && (
                <span
                  className={`hbar-fill ${r.muted ? "hbar-fill--muted" : ""}`}
                  style={{
                    width: `${Math.min(100, (r.value / top) * 100)}%`,
                    background: color,
                  }}
                />
              )}
              {goal && (
                <span
                  className="hbar-goal"
                  style={{
                    left: `${Math.min(100, (goal.value / top) * 100)}%`,
                  }}
                  title={goal.label}
                />
              )}
            </span>
            <strong className="hbar-value">{r.display}</strong>
          </>
        )
        const tipBind = bind(
          r.label,
          r.tip || [r.display, ...(r.sub ? [r.sub] : [])],
        )
        return onSelect ? (
          <button
            key={r.label}
            type="button"
            className={`hbar-row hbar-row--button ${
              selected === r.label ? "is-selected" : ""
            }`}
            aria-pressed={selected === r.label}
            onClick={() => onSelect(r.label)}
            {...tipBind}
          >
            {body}
          </button>
        ) : (
          <div key={r.label} className="hbar-row" {...tipBind}>
            {body}
          </div>
        )
      })}
      {node}
    </div>
  )
}

export function Stacked100({
  rows,
  labels,
  colors,
}: {
  rows: {
    label: string
    values: number[]
    sub?: string
  }[]
  labels: string[]
  colors: string[]
}) {
  const { box, bind, node } = useTip()
  return (
    <div className="chart stack100" ref={box}>
      {rows.map((r) => {
        const total = r.values.reduce((a, b) => a + b, 0)
        return (
          <div className="stack-row" key={r.label}>
            <span className="hbar-label">
              {r.label}
              {r.sub && <small>{r.sub}</small>}
            </span>
            <span className="stack-track">
              {total === 0 ? (
                <em>Dados insuficientes</em>
              ) : (
                r.values.map((v, i) =>
                  v === 0 ? null : (
                    <span
                      key={labels[i]}
                      tabIndex={0}
                      className="stack-seg"
                      aria-label={`${r.label}, ${labels[i]}: ${v} (${Math.round((v / total) * 100)}%)`}
                      style={{
                        width: `${(v / total) * 100}%`,
                        background: colors[i],
                      }}
                      {...bind(r.label, [
                        `${labels[i]}: ${v} (${((v / total) * 100).toFixed(1).replace(".", ",")}%)`,
                        `Total: ${total}`,
                      ])}
                    />
                  ),
                )
              )}
            </span>
          </div>
        )
      })}
      {node}
    </div>
  )
}

export function GroupedHBars({
  rows,
  series,
  selected,
  onSelect,
}: {
  rows: {
    label: string
    values: number[]
  }[]
  series: {
    label: string
    color: string
  }[]
  selected?: string
  onSelect?: (label: string) => void
}) {
  const { box, bind, node } = useTip()
  const top = Math.max(1, ...rows.flatMap((r) => r.values))
  return (
    <div className="chart hbars" ref={box}>
      {rows.map((r) => {
        const lines = series.map((s, i) => `${s.label}: ${r.values[i]}`)
        return (
          <button
            type="button"
            key={r.label}
            className={`hbar-row hbar-row--button ${
              selected === r.label ? "is-selected" : ""
            }`}
            aria-pressed={onSelect ? selected === r.label : undefined}
            aria-label={`${r.label}. ${lines.join(". ")}`}
            onClick={onSelect ? () => onSelect(r.label) : undefined}
            {...bind(r.label, lines)}
          >
            <span className="hbar-label">{r.label}</span>
            <span className="grouped-tracks">
              {series.map((s, i) => (
                <span key={s.label} className="hbar-track hbar-track--thin">
                  <span
                    className="hbar-fill"
                    style={{
                      width: `${(r.values[i] / top) * 100}%`,
                      background: s.color,
                    }}
                  />
                </span>
              ))}
            </span>
            <strong className="hbar-value">{r.values.join(" · ")}</strong>
          </button>
        )
      })}
      {node}
    </div>
  )
}

export function Heatmap({
  rows,
  cols,
  colLabel,
  selected,
  onSelect,
}: {
  rows: {
    label: string
    size: number
    cells: (number | null)[]
  }[]
  cols: number
  colLabel: (k: number) => string
  selected?: string
  onSelect?: (label: string) => void
}) {
  const { box, bind, node } = useTip()
  return (
    <div className="chart heatmap-wrap" ref={box}>
      <table className="heatmap">
        <thead>
          <tr>
            <th scope="col">Ingresso</th>
            <th scope="col">Alunos</th>
            {Array.from({ length: cols }, (_, k) => (
              <th scope="col" key={k}>
                {colLabel(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.label}
              className={selected === r.label ? "is-selected" : ""}
            >
              <th scope="row">
                {onSelect ? (
                  <button
                    type="button"
                    aria-pressed={selected === r.label}
                    onClick={() => onSelect(r.label)}
                  >
                    {r.label}
                  </button>
                ) : (
                  r.label
                )}
              </th>
              <td className="heatmap-size">{r.size}</td>
              {r.cells.map((c, k) => {
                const pct = c === null ? null : Math.round(c * 100)
                return (
                  <td
                    key={k}
                    tabIndex={c === null ? undefined : 0}
                    className={
                      c === null
                        ? "heatmap-empty"
                        : pct! >= 60
                          ? "heatmap-strong"
                          : ""
                    }
                    style={
                      c === null
                        ? undefined
                        : {
                            ["--heat" as string]: `${Math.round(12 + c * 88)}%`,
                          }
                    }
                    aria-label={
                      c === null
                        ? undefined
                        : `Coorte ${r.label}, ${colLabel(k)}: ${pct}% ainda ativos de ${r.size}`
                    }
                    {...(c === null
                      ? {}
                      : bind(`Coorte ${r.label} · ${colLabel(k)}`, [
                          `${pct}% ainda ativos`,
                          `Base da coorte: ${r.size} aluno(s)`,
                        ]))}
                  >
                    {pct === null ? "" : pct}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {node}
    </div>
  )
}

export function Pareto({
  items,
  height = 250,
  ariaLabel,
}: {
  items: {
    label: string
    value: number
    cumulative: number
  }[]
  height?: number
  ariaLabel: string
}) {
  const { box, bind, node } = useTip()
  const w = useWidth(box)
  const m = { l: 38, r: 42, t: 16, b: 46 }
  const iw = w - m.l - m.r
  const ih = height - m.t - m.b
  const top = Math.max(1, ...items.map((i) => i.value)) * 1.1
  const slot = iw / Math.max(1, items.length)
  const bw = Math.min(54, slot * 0.66)
  const cx = (i: number) => m.l + slot * i + slot / 2
  const yl = (v: number) => m.t + ih - (v / top) * ih
  const yr = (p: number) => m.t + ih - p * ih
  const short = (s: string) =>
    s.length > 14 && slot < 110 ? s.slice(0, 12) + "…" : s
  return (
    <div className="chart" ref={box}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel}>
        {ticks(0, 1).map((p) => (
          <g key={p}>
            <line
              x1={m.l}
              x2={w - m.r}
              y1={yr(p)}
              y2={yr(p)}
              className="chart-grid"
            />
            <text
              x={w - m.r + 6}
              y={yr(p)}
              className="chart-axis"
              dominantBaseline="middle"
            >
              {Math.round(p * 100)}%
            </text>
            <text
              x={m.l - 8}
              y={yr(p)}
              className="chart-axis"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {Math.round(top * p)}
            </text>
          </g>
        ))}
        {items.map((it, i) => (
          <g key={it.label}>
            <rect
              x={cx(i) - bw / 2}
              y={yl(it.value)}
              width={bw}
              height={m.t + ih - yl(it.value)}
              fill="var(--chart-1)"
              rx={3}
            />
            <text
              x={cx(i)}
              y={height - 26}
              className="chart-axis"
              textAnchor="middle"
            >
              {short(it.label)}
            </text>
          </g>
        ))}
        <path
          d={items
            .map((it, i) => `${i ? "L" : "M"}${cx(i)},${yr(it.cumulative)}`)
            .join("")}
          fill="none"
          stroke="var(--chart-3)"
          strokeWidth={2.4}
        />
        {items.map((it, i) => (
          <circle
            key={`c${i}`}
            cx={cx(i)}
            cy={yr(it.cumulative)}
            r={3.5}
            fill="var(--surface)"
            stroke="var(--chart-3)"
            strokeWidth={2}
          />
        ))}
        <line
          x1={m.l}
          x2={w - m.r}
          y1={yr(0.8)}
          y2={yr(0.8)}
          className="chart-goal"
        />
        {items.map((it, i) => {
          const lines = [
            `Quantidade: ${it.value}`,
            `Acumulado: ${Math.round(it.cumulative * 100)}%`,
          ]
          return (
            <rect
              key={`h${i}`}
              x={m.l + slot * i}
              y={m.t}
              width={slot}
              height={ih}
              className="chart-hit"
              tabIndex={0}
              aria-label={`${it.label}. ${lines.join(". ")}`}
              {...bind(it.label, lines)}
            />
          )
        })}
      </svg>
      {node}
    </div>
  )
}

export function Scatter({
  points,
  xLabel,
  yLabel,
  formatX,
  formatY,
  height = 270,
  ariaLabel,
}: {
  points: {
    label: string
    x: number
    y: number
    n: number
    small?: boolean
  }[]
  xLabel: string
  yLabel: string
  formatX: (v: number) => string
  formatY: (v: number) => string
  height?: number
  ariaLabel: string
}) {
  const { box, bind, node } = useTip()
  const w = useWidth(box)
  const m = { l: 50, r: 18, t: 16, b: 40 }
  const iw = w - m.l - m.r
  const ih = height - m.t - m.b
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x0 = Math.max(1, Math.floor((Math.min(...xs, 5) - 0.3) * 2) / 2)
  const x1 = 5
  const y0 = Math.max(0, Math.floor((Math.min(...ys, 1) - 0.1) * 10) / 10)
  const y1 = 1
  const sx = (v: number) => m.l + ((v - x0) / (x1 - x0 || 1)) * iw
  const sy = (v: number) => m.t + ih - ((v - y0) / (y1 - y0 || 1)) * ih
  const maxN = Math.max(1, ...points.map((p) => p.n))
  return (
    <div className="chart" ref={box}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel}>
        {ticks(y0, y1).map((t) => (
          <g key={`y${t}`}>
            <line
              x1={m.l}
              x2={w - m.r}
              y1={sy(t)}
              y2={sy(t)}
              className="chart-grid"
            />
            <text
              x={m.l - 8}
              y={sy(t)}
              className="chart-axis"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatY(t)}
            </text>
          </g>
        ))}
        {ticks(x0, x1).map((t) => (
          <text
            key={`x${t}`}
            x={sx(t)}
            y={m.t + ih + 16}
            className="chart-axis"
            textAnchor="middle"
          >
            {formatX(t)}
          </text>
        ))}
        <text
          x={m.l + iw / 2}
          y={height - 4}
          className="chart-axis chart-axis--title"
          textAnchor="middle"
        >
          {xLabel}
        </text>
        <text
          x={12}
          y={m.t + ih / 2}
          className="chart-axis chart-axis--title"
          textAnchor="middle"
          transform={`rotate(-90 12 ${m.t + ih / 2})`}
        >
          {yLabel}
        </text>
        {points.map((p, i) => {
          const lines = [
            `${xLabel}: ${formatX(p.x)}`,
            `${yLabel}: ${formatY(p.y)}`,
            `n = ${p.n} avaliação(ões)${p.small ? " · amostra pequena" : ""}`,
          ]
          return (
            <circle
              key={p.label}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={5 + Math.sqrt(p.n / maxN) * 11}
              fill={p.small ? "transparent" : SERIES[i % SERIES.length]}
              fillOpacity={0.78}
              stroke={SERIES[i % SERIES.length]}
              strokeWidth={2}
              strokeDasharray={p.small ? "3 3" : undefined}
              tabIndex={0}
              className="chart-point"
              aria-label={`${p.label}. ${lines.join(". ")}`}
              {...bind(p.label, lines)}
            />
          )
        })}
      </svg>
      {node}
    </div>
  )
}

export function Sparkline({
  values,
  color = "var(--chart-1)",
}: {
  values: (number | null)[]
  color?: string
}) {
  const v = values.filter((x): x is number => x !== null)
  if (v.length < 2) return null
  const min = Math.min(...v)
  const max = Math.max(...v)
  const w = 96
  const h = 30
  let d = ""
  let open = false
  values.forEach((x, i) => {
    if (x === null) {
      open = false
      return
    }
    const px = (i / (values.length - 1)) * w
    const py = h - 3 - ((x - min) / (max - min || 1)) * (h - 6)
    d += `${open ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`
    open = true
  })
  return (
    <svg
      className="sparkline"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: string[]
  rows: ReactNode[][]
  caption: string
}) {
  return (
    <details className="chart-data">
      <summary>Ver dados em tabela</summary>
      <div className="simple-table-wrap">
        <table className="simple-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, k) => (
                  <td key={k}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

import type { Day } from "./types"

const MS = 86400000
const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
]
const pad = (n: number) => String(n).padStart(2, "0")
const utc = (n: Day) => new Date(n * MS)

export const today = (): Day => {
  const d = new Date()
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS
}
function make(y: number, m: number, d: number): Day | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCDate() === d ? dt.getTime() / MS : null
}
/** Accepts YYYY-MM-DD (optionally with time) or DD/MM/YYYY. */
export function parseDay(raw: string): Day | null {
  const t = raw.trim()
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t)
  if (m) return make(+m[1], +m[2], +m[3])
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t)
  if (m) return make(+m[3], +m[2], +m[1])
  return null
}
/** Timestamps: ISO date-time, date, or epoch (s or ms). */
export function parseStamp(raw: string): Day | null {
  const t = raw.trim()
  if (/^\d{10,13}$/.test(t)) {
    const ms = t.length === 13 ? +t : +t * 1000
    return Math.floor(ms / MS)
  }
  const d = parseDay(t)
  if (d !== null) return d
  const p = Date.parse(t)
  return Number.isNaN(p) ? null : Math.floor(p / MS)
}
export const iso = (n: Day) => utc(n).toISOString().slice(0, 10)
export const fmtDay = (n: Day) => {
  const d = utc(n)
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}
export const fmtShort = (n: Day) => {
  const d = utc(n)
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`
}
export const monthStart = (n: Day): Day => {
  const d = utc(n)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / MS
}
/** First day of the month `k` months after the month containing `n`. */
export const addMonths = (n: Day, k: number): Day => {
  const d = utc(n)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + k, 1) / MS
}
export const monthLabel = (n: Day) => {
  const d = utc(n)
  return `${MONTHS[d.getUTCMonth()]}/${String(d.getUTCFullYear()).slice(2)}`
}
export const nowStamp = () => {
  const d = new Date()
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

import { categorize } from "./csv"
import {
  addMonths,
  fmtDay,
  fmtShort,
  monthLabel,
  monthStart,
  parseDay,
} from "./dates"
import type {
  Aluno,
  Avaliacao,
  CancelSide,
  Dataset,
  Day,
  Desistencia,
  Encontro,
  FileKind,
  Filters,
  Interesse,
  Origem,
  Participacao,
  Settings,
} from "./types"
import { DIMENSIONS } from "./types"

export type Range = {
  start: Day
  end: Day
}
export type Bucket = Range & { label: string }
export type Part = Participacao & { e: Encontro }
export type Aval = Avaliacao & { e: Encontro | undefined }

export const PERIOD_DAYS: Record<Exclude<Filters["period"], "custom">, number> =
  {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "12m": 365,
  }
export const PERIOD_LABEL: Record<Filters["period"], string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  "12m": "Últimos 12 meses",
  custom: "Personalizado",
}
export const INGRESSO_LABEL: Record<Filters["ingresso"], string> = {
  todas: "Todas as faixas",
  ate3: "Ingresso há até 3 meses",
  "3a12": "Ingresso entre 3 e 12 meses",
  mais12: "Ingresso há mais de 12 meses",
}
export const SITUACAO_LABEL: Record<Filters["situacao"], string> = {
  todos: "Todas as situações",
  ativo: "Ativos",
  desistente: "Desistentes",
}

export function periodRange(f: Filters, ref: Day): Range {
  if (f.period === "custom") {
    const a = parseDay(f.from)
    const b = parseDay(f.to)
    if (a !== null && b !== null && a <= b) return { start: a, end: b }
  }
  const len = PERIOD_DAYS[f.period === "custom" ? "90d" : f.period]
  return { start: ref - len + 1, end: ref }
}
export const previousRange = (r: Range): Range => {
  const len = r.end - r.start + 1
  return { start: r.start - len, end: r.start - 1 }
}
export const rangeLabel = (r: Range) => `${fmtDay(r.start)} a ${fmtDay(r.end)}`
export const inRange = (d: Day, r: Range) => d >= r.start && d <= r.end

export function makeBuckets(r: Range): Bucket[] {
  const span = r.end - r.start + 1
  const out: Bucket[] = []
  if (span > 62) {
    for (let m = monthStart(r.start); m <= r.end; m = addMonths(m, 1)) {
      out.push({
        start: Math.max(m, r.start),
        end: Math.min(addMonths(m, 1) - 1, r.end),
        label: monthLabel(m),
      })
    }
  } else {
    const step = span > 14 ? 7 : 1
    for (let d = r.start; d <= r.end; d += step)
      out.push({
        start: d,
        end: Math.min(d + step - 1, r.end),
        label: fmtShort(d),
      })
  }
  return out
}
export const granularity = (r: Range) =>
  r.end - r.start + 1 > 62 ? "mês" : r.end - r.start + 1 > 14 ? "semana" : "dia"

/* ---------- Filtered context ---------- */

export type Ctx = {
  ds: Dataset
  f: Filters
  ref: Day
  range: Range
  prev: Range
  buckets: Bucket[]
  has: (k: FileKind) => boolean
  students: Aluno[]
  studentIds: Set<string>
  exitOf: Map<string, Day | null>
  encontros: Encontro[]
  parts: Part[]
  partsByAluno: Map<string, Part[]>
  avals: Aval[]
  desist: Desistencia[]
  interesses: Interesse[]
  regionOf: Map<string, string>
  regionsOfExp: Map<string, Set<string>>
  options: {
    regioes: string[]
    professores: string[]
    modalidades: string[]
  }
}

const uniq = (xs: string[]) =>
  [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"))

let cache: {
  ds: Dataset
  key: string
  ctx: Ctx
} | null = null
export function getCtx(ds: Dataset, f: Filters): Ctx {
  const key = JSON.stringify(f)
  if (cache && cache.ds === ds && cache.key === key) return cache.ctx
  const ctx = buildCtx(ds, f)
  cache = { ds, key, ctx }
  return ctx
}

function buildCtx(ds: Dataset, f: Filters): Ctx {
  const has = (k: FileKind) => ds.available.includes(k)
  const ref = ds.refDay
  const range = periodRange(f, ref)
  const expById = new Map(ds.encontros.map((e) => [e.id, e]))
  const firstExit = new Map<string, Day>()
  for (const d of ds.desistencias) {
    const cur = firstExit.get(d.aluno)
    if (cur === undefined || d.data < cur) firstExit.set(d.aluno, d.data)
  }
  const exitOf = new Map<string, Day | null>()
  for (const a of ds.alunos) {
    const dd = firstExit.get(a.id)
    const v = a.saida ?? dd ?? null
    exitOf.set(
      a.id,
      dd !== undefined && a.saida !== null ? Math.min(a.saida, dd) : v,
    )
  }
  const teachersOf = new Map<string, Set<string>>()
  const modsOf = new Map<string, Set<string>>()
  for (const p of ds.participacoes) {
    const e = expById.get(p.exp)
    if (!e) continue
    if (!teachersOf.has(p.aluno)) {
      teachersOf.set(p.aluno, new Set())
      modsOf.set(p.aluno, new Set())
    }
    teachersOf.get(p.aluno)!.add(e.professor)
    modsOf.get(p.aluno)!.add(e.modalidade)
  }
  const students = ds.alunos.filter((a) => {
    if (f.regiao && a.regiao !== f.regiao) return false
    const exit = exitOf.get(a.id) ?? null
    const left = (exit !== null && exit <= ref) || a.status === "desistente"
    if (f.situacao === "ativo" && left) return false
    if (f.situacao === "desistente" && !left) return false
    const age = ref - a.ingresso
    if (f.ingresso === "ate3" && age > 91) return false
    if (f.ingresso === "3a12" && (age <= 91 || age > 365)) return false
    if (f.ingresso === "mais12" && age <= 365) return false
    if (f.professor && !teachersOf.get(a.id)?.has(f.professor)) return false
    if (f.modalidade && !modsOf.get(a.id)?.has(f.modalidade)) return false
    return true
  })
  const studentIds = new Set(students.map((s) => s.id))
  const regionOf = new Map(ds.alunos.map((a) => [a.id, a.regiao]))
  const narrowed =
    has("alunos") &&
    (!!f.regiao || f.situacao !== "todos" || f.ingresso !== "todas")
  const expHasStudent = new Set<string>()
  const regionsOfExp = new Map<string, Set<string>>()
  for (const p of ds.participacoes) {
    if (studentIds.has(p.aluno)) expHasStudent.add(p.exp)
    const reg = regionOf.get(p.aluno)
    if (reg) {
      if (!regionsOfExp.has(p.exp)) regionsOfExp.set(p.exp, new Set())
      regionsOfExp.get(p.exp)!.add(reg)
    }
  }
  const encontros = ds.encontros.filter(
    (e) =>
      (!f.professor || e.professor === f.professor) &&
      (!f.modalidade || e.modalidade === f.modalidade) &&
      (!narrowed || expHasStudent.has(e.id)),
  )
  const expSet = new Map(encontros.map((e) => [e.id, e]))
  const parts: Part[] = []
  const partsByAluno = new Map<string, Part[]>()
  for (const p of ds.participacoes) {
    const e = expSet.get(p.exp)
    if (!e || (has("alunos") && !studentIds.has(p.aluno))) continue
    const part = { ...p, e }
    parts.push(part)
    const list = partsByAluno.get(p.aluno)
    if (list) list.push(part)
    else partsByAluno.set(p.aluno, [part])
  }
  const filteredByExp = !!f.professor || !!f.modalidade || narrowed
  const avals: Aval[] = ds.avaliacoes
    .map((a) => ({ ...a, e: expById.get(a.exp) }))
    .filter((a) => !has("experiencias") || !filteredByExp || expSet.has(a.exp))
  const desist = has("alunos")
    ? ds.desistencias.filter((d) => studentIds.has(d.aluno))
    : ds.desistencias
  const interesses = ds.interesses.filter(
    (i) =>
      (!f.regiao || i.regiao === f.regiao) &&
      (!f.modalidade || i.modalidade === f.modalidade),
  )
  return {
    ds,
    f,
    ref,
    range,
    prev: previousRange(range),
    buckets: makeBuckets(range),
    has,
    students,
    studentIds,
    exitOf,
    encontros,
    parts,
    partsByAluno,
    avals,
    desist,
    interesses,
    regionOf,
    regionsOfExp,
    options: {
      regioes: uniq([
        ...ds.alunos.map((a) => a.regiao),
        ...ds.interesses.map((i) => i.regiao),
      ]),
      professores: uniq(ds.encontros.map((e) => e.professor)),
      modalidades: uniq([
        ...ds.encontros.map((e) => e.modalidade),
        ...ds.interesses.map((i) => i.modalidade),
      ]),
    },
  }
}

/* ---------- Result helpers ---------- */

export type Status = "ok" | "insuficiente" | "indisponivel"
export type Need = {
  status: Status
  need?: string
}
const missing = (ctx: Ctx, kinds: FileKind[]): Need | null => {
  const lack = kinds.filter((k) => !ctx.has(k))
  return lack.length
    ? { status: "indisponivel", need: lack.map((k) => `${k}.csv`).join(", ") }
    : null
}
const st = (m: Need | null, status: Status): Need => m || { status }
const ratio = (a: number, b: number) => (b > 0 ? a / b : null)

/* ---------- Retention ---------- */

const isActive = (ctx: Ctx, a: Aluno, d: Day) => {
  const exit = ctx.exitOf.get(a.id) ?? null
  return a.ingresso <= d && (exit === null || exit > d)
}
export function retention(ctx: Ctx, r: Range) {
  const m = missing(ctx, ["alunos"])
  const base = ctx.students.filter((a) => {
    const exit = ctx.exitOf.get(a.id) ?? null
    return a.ingresso < r.start && (exit === null || exit >= r.start)
  })
  const retained = base.filter((a) => {
    const exit = ctx.exitOf.get(a.id) ?? null
    return exit === null || exit > r.end
  }).length
  const rate = ratio(retained, base.length)
  return {
    ...st(m, rate === null ? "insuficiente" : "ok"),
    base: base.length,
    retained,
    lost: base.length - retained,
    rate,
  }
}
export function dropouts(ctx: Ctx, r: Range) {
  const m = missing(ctx, ["alunos"])
  let fromBase = 0
  let newcomers = 0
  for (const a of ctx.students) {
    const exit = ctx.exitOf.get(a.id) ?? null
    if (exit === null || !inRange(exit, r)) continue
    if (a.ingresso < r.start) fromBase++
    else newcomers++
  }
  const ret = retention(ctx, r)
  return {
    ...st(m, ret.base ? "ok" : "insuficiente"),
    count: fromBase,
    newcomers,
    base: ret.base,
    rate: ratio(fromBase, ret.base),
  }
}
export function flows(ctx: Ctx, b: Range) {
  let ingressos = 0
  let saidas = 0
  let permanencias = 0
  for (const a of ctx.students) {
    const exit = ctx.exitOf.get(a.id) ?? null
    if (inRange(a.ingresso, b)) ingressos++
    if (exit !== null && inRange(exit, b)) saidas++
    if (a.ingresso < b.start && (exit === null || exit > b.end)) permanencias++
  }
  return { ingressos, saidas, permanencias }
}

export type CohortRow = {
  label: string
  size: number
  cells: (number | null)[]
}
export function cohorts(ctx: Ctx) {
  let first = monthStart(ctx.range.start)
  const last = monthStart(ctx.range.end)
  let note = ""
  let count = 0
  for (let m = first; m <= last; m = addMonths(m, 1)) count++
  if (count < 3) {
    first = addMonths(last, -5)
    note =
      "O período selecionado tem menos de 3 meses; para permitir a comparação, são exibidas as coortes dos 6 meses de ingresso até o fim do período."
  }
  const rows: CohortRow[] = []
  const cols = 12
  for (let m = first; m <= last; m = addMonths(m, 1)) {
    const next = addMonths(m, 1)
    const group = ctx.students.filter(
      (a) => a.ingresso >= m && a.ingresso < next,
    )
    const cells: (number | null)[] = []
    for (let k = 0; k < cols; k++) {
      const checkpoint = addMonths(m, k + 1) - 1
      if (checkpoint > ctx.ref || !group.length) {
        cells.push(null)
        continue
      }
      cells.push(
        group.filter((a) => isActive(ctx, a, checkpoint)).length / group.length,
      )
    }
    rows.push({ label: monthLabel(m), size: group.length, cells })
  }
  return { ...st(missing(ctx, ["alunos"]), "ok"), rows, cols, note }
}

const presenceOf = (list: Part[], r: Range, until?: Day | null) => {
  let expected = 0
  let present = 0
  let unjust = 0
  for (const p of list) {
    if (
      p.e.status !== "realizada" ||
      p.presente === null ||
      !inRange(p.e.data, r)
    )
      continue
    if (until != null && p.e.data >= until) continue
    expected++
    if (p.presente) present++
    else if (!p.justificativa) unjust++
  }
  return { expected, present, unjust, rate: ratio(present, expected) }
}

export const FREQ_BANDS = [
  "Abaixo de 50%",
  "50% a 69%",
  "70% a 84%",
  "85% ou mais",
]
export function frequencyVsDropout(ctx: Ctx, r: Range) {
  const m = missing(ctx, ["alunos", "participacoes", "experiencias"])
  const bands = [...FREQ_BANDS, "Sem registros suficientes"].map((label) => ({
    label,
    n: 0,
    lost: 0,
  }))
  for (const a of ctx.students) {
    const exit = ctx.exitOf.get(a.id) ?? null
    if (!(a.ingresso < r.start && (exit === null || exit >= r.start))) continue
    const pr = presenceOf(ctx.partsByAluno.get(a.id) || [], r, exit)
    const rate = pr.expected >= 2 ? pr.rate : null
    const idx =
      rate === null ? 4 : rate < 0.5 ? 0 : rate < 0.7 ? 1 : rate < 0.85 ? 2 : 3
    bands[idx].n++
    if (exit !== null && exit <= r.end) bands[idx].lost++
  }
  return {
    ...st(m, "ok"),
    bands: bands.map((b) => ({ ...b, rate: ratio(b.lost, b.n) })),
  }
}

/* ---------- Presence, cancellations, satisfaction ---------- */

export function presence(ctx: Ctx, r: Range) {
  const m = missing(ctx, ["participacoes", "experiencias"])
  const pr = presenceOf(ctx.parts, r)
  return {
    ...st(m, pr.expected ? "ok" : "insuficiente"),
    ...pr,
    absent: pr.expected - pr.present,
  }
}
export function cancellations(ctx: Ctx, r: Range) {
  const m = missing(ctx, ["experiencias"])
  const bySide: Record<CancelSide, number> = {
    aluno: 0,
    professor: 0,
    escola: 0,
    nao_informado: 0,
  }
  let scheduled = 0
  let cancelled = 0
  for (const e of ctx.encontros) {
    if (!inRange(e.data, r) || e.status === "prevista") continue
    scheduled++
    if (e.status === "cancelada") {
      cancelled++
      bySide[e.responsavel || "nao_informado"]++
    }
  }
  return {
    ...st(m, scheduled ? "ok" : "insuficiente"),
    scheduled,
    cancelled,
    rate: ratio(cancelled, scheduled),
    bySide,
  }
}

const meanOf = (a: Avaliacao, dims?: number[]) => {
  const vals = (dims ? dims.map((i) => a.notas[i]) : a.notas).filter(
    (v): v is number => v !== null,
  )
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
}
export function satisfaction(ctx: Ctx, r: Range, origem?: Origem | "") {
  const m = missing(ctx, ["avaliacoes"])
  const list = ctx.avals.filter(
    (a) => inRange(a.data, r) && (!origem || a.origem === origem),
  )
  let sum = 0
  let k = 0
  for (const a of list) {
    const v = meanOf(a)
    if (v !== null) {
      sum += v
      k++
    }
  }
  const answers = list.filter((a) => a.origem !== "professor").length
  const pres = ctx.has("participacoes") ? presenceOf(ctx.parts, r).present : 0
  return {
    ...st(m, k ? "ok" : "insuficiente"),
    mean: k ? sum / k : null,
    n: list.length,
    answers,
    responseRate: pres ? Math.min(1, answers / pres) : null,
  }
}
export function dimensions(ctx: Ctx, r: Range, origem: Origem | "" = "") {
  const list = ctx.avals.filter(
    (a) => inRange(a.data, r) && (!origem || a.origem === origem),
  )
  return DIMENSIONS.map((d, i) => {
    const dist = [0, 0, 0, 0, 0]
    let sum = 0
    let n = 0
    for (const a of list) {
      const v = a.notas[i]
      if (v === null) continue
      sum += v
      n++
      dist[Math.min(4, Math.max(0, Math.round(v) - 1))]++
    }
    return { ...d, mean: n ? sum / n : null, n, dist }
  })
}
export function byTeacher(ctx: Ctx, r: Range, s: Settings) {
  const teachers = uniq(ctx.encontros.map((e) => e.professor))
  return teachers.map((t) => {
    const list = ctx.avals.filter(
      (a) => a.e?.professor === t && inRange(a.data, r),
    )
    const prevList = ctx.avals.filter(
      (a) => a.e?.professor === t && inRange(a.data, ctx.prev),
    )
    const avg = (xs: Aval[], dims?: number[]) => {
      const v = xs
        .map((a) => meanOf(a, dims))
        .filter((x): x is number => x !== null)
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
    }
    const pres = presenceOf(
      ctx.parts.filter((p) => p.e.professor === t),
      r,
    )
    const answers = list.filter((a) => a.origem !== "professor").length
    return {
      professor: t,
      modalidades: uniq(
        ctx.encontros.filter((e) => e.professor === t).map((e) => e.modalidade),
      ),
      mean: avg(list),
      prevMean: avg(prevList),
      n: list.length,
      responseRate: pres.present ? Math.min(1, answers / pres.present) : null,
      presence: pres.rate,
      small: list.length < s.amostraMinima,
      dims: DIMENSIONS.map((_, i) => avg(list, [i])),
      bySource: (["aluno", "responsavel", "professor"] as Origem[]).map(
        (o) => ({
          origem: o,
          mean: avg(list.filter((a) => a.origem === o)),
          n: list.filter((a) => a.origem === o).length,
        }),
      ),
    }
  })
}
export function satisfactionVsContinuity(ctx: Ctx, r: Range, s: Settings) {
  const groups = new Map<string, {
    professor: string
    modalidade: string
  }>()
  for (const e of ctx.encontros)
    groups.set(`${e.professor}|${e.modalidade}`, {
      professor: e.professor,
      modalidade: e.modalidade,
    })
  return [...groups.values()]
    .map((g) => {
      const list = ctx.avals.filter(
        (a) =>
          a.e?.professor === g.professor &&
          a.e?.modalidade === g.modalidade &&
          inRange(a.data, r),
      )
      const v = list
        .map((a) => meanOf(a))
        .filter((x): x is number => x !== null)
      const pr = presenceOf(
        ctx.parts.filter(
          (p) =>
            p.e.professor === g.professor && p.e.modalidade === g.modalidade,
        ),
        r,
      )
      return {
        ...g,
        label: `${g.professor} · ${g.modalidade}`,
        x: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null,
        y: pr.rate,
        n: list.length,
        small: list.length < s.amostraMinima,
      }
    })
    .filter((g) => g.x !== null && g.y !== null)
}
export function intentByModality(ctx: Ctx, r: Range) {
  const mods = uniq(ctx.encontros.map((e) => e.modalidade))
  return mods.map((mod) => {
    const list = ctx.avals.filter(
      (a) =>
        a.e?.modalidade === mod &&
        a.origem !== "professor" &&
        inRange(a.data, r) &&
        a.notas[3] !== null,
    )
    const yes = list.filter((a) => (a.notas[3] ?? 0) >= 4).length
    return { label: mod, n: list.length, rate: ratio(yes, list.length) }
  })
}
export function engagementSeries(ctx: Ctx) {
  return ctx.buckets.map((b) => {
    const pr = presenceOf(ctx.parts, b)
    const list = ctx.avals.filter(
      (a) =>
        a.origem !== "professor" && inRange(a.data, b) && a.notas[3] !== null,
    )
    return {
      label: b.label,
      presence: pr.rate,
      presenceN: pr.expected,
      intent: ratio(
        list.filter((a) => (a.notas[3] ?? 0) >= 4).length,
        list.length,
      ),
      intentN: list.length,
    }
  })
}

/* ---------- Reasons ---------- */

export type ReasonRow = {
  label: string
  value: number
  share: number
  cumulative: number
  example: string
}
type RankItem = {
  cat: string
  text: string
}
function rank(items: RankItem[]): ReasonRow[] {
  const map = new Map<string, {
    value: number
    examples: Map<string, number>
  }>()
  for (const it of items) {
    const cur = map.get(it.cat) || { value: 0, examples: new Map() }
    cur.value++
    if (it.text) cur.examples.set(it.text, (cur.examples.get(it.text) || 0) + 1)
    map.set(it.cat, cur)
  }
  const total = items.length
  let acc = 0
  return [...map.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .map(([label, v]) => {
      acc += v.value
      const example =
        [...v.examples.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—"
      return {
        label,
        value: v.value,
        share: v.value / total,
        cumulative: acc / total,
        example,
      }
    })
}
export function cancelReasons(ctx: Ctx, r: Range, side: CancelSide | "" = "") {
  return rank(
    ctx.encontros
      .filter(
        (e) =>
          e.status === "cancelada" &&
          inRange(e.data, r) &&
          (!side || (e.responsavel || "nao_informado") === side),
      )
      .map((e) => ({ cat: categorize(e.motivo), text: e.motivo })),
  )
}
export function dropoutReasons(ctx: Ctx, r: Range) {
  return rank(
    ctx.desist
      .filter((d) => inRange(d.data, r))
      .map((d) => ({ cat: d.categoria, text: d.declarado })),
  )
}

/* ---------- Regions ---------- */

export const GROUPED = "Outras regiões (agrupadas)"
export function regions(ctx: Ctx, r: Range, s: Settings) {
  const m = missing(ctx, ["alunos"])
  const stats = new Map<string, {
    active: number
    base: number
    retained: number
    ids: string[]
  }>()
  for (const a of ctx.students) {
    const cur = stats.get(a.regiao) || {
      active: 0,
      base: 0,
      retained: 0,
      ids: [],
    }
    const exit = ctx.exitOf.get(a.id) ?? null
    if (isActive(ctx, a, r.end)) cur.active++
    if (a.ingresso < r.start && (exit === null || exit >= r.start)) {
      cur.base++
      if (exit === null || exit > r.end) cur.retained++
    }
    cur.ids.push(a.id)
    stats.set(a.regiao, cur)
  }
  const small = [...stats.entries()].filter(
    ([, v]) => Math.max(v.active, v.base) < s.minRegiao,
  )
  const rows = [...stats.entries()]
    .filter(([, v]) => Math.max(v.active, v.base) >= s.minRegiao)
    .map(([label, v]) => ({ label, ...v }))
  if (small.length) {
    rows.push(
      small.reduce(
        (acc, [, v]) => ({
          label: GROUPED,
          active: acc.active + v.active,
          base: acc.base + v.base,
          retained: acc.retained + v.retained,
          ids: [...acc.ids, ...v.ids],
        }),
        {
          label: GROUPED,
          active: 0,
          base: 0,
          retained: 0,
          ids: [] as string[],
        },
      ),
    )
  }
  const groupOf = (reg: string) =>
    small.some(([k]) => k === reg) ? GROUPED : reg
  return {
    ...st(m, rows.length ? "ok" : "insuficiente"),
    smallCount: small.length,
    groupOf,
    rows: rows
      .map((row) => {
        const set = new Set(row.ids)
        const pr = presenceOf(
          ctx.parts.filter((p) => set.has(p.aluno)),
          r,
        )
        return {
          label: row.label,
          active: row.active,
          base: row.base,
          retained: row.retained,
          retention: ratio(row.retained, row.base),
          presence: pr.rate,
        }
      })
      .sort((a, b) =>
        a.label === GROUPED
          ? 1
          : b.label === GROUPED
            ? -1
            : b.active - a.active,
      ),
  }
}
export function cancelByRegion(
  ctx: Ctx,
  r: Range,
  groupOf: (reg: string) => string,
) {
  const out = new Map<string, Map<string, number>>()
  for (const e of ctx.encontros) {
    if (e.status !== "cancelada" || !inRange(e.data, r)) continue
    const regs = new Set([...(ctx.regionsOfExp.get(e.id) || [])].map(groupOf))
    if (ctx.f.regiao)
      for (const reg of [...regs]) if (reg !== ctx.f.regiao) regs.delete(reg)
    for (const reg of regs) {
      const m = out.get(reg) || new Map<string, number>()
      const cat = categorize(e.motivo)
      m.set(cat, (m.get(cat) || 0) + 1)
      out.set(reg, m)
    }
  }
  return out
}
export function demand(ctx: Ctx, r: Range, groupOf: (reg: string) => string) {
  const m = missing(ctx, ["interesses"])
  const map = new Map<string, {
    total: number
    atendido: number
    espera: number
    naoAtendido: number
  }>()
  for (const i of ctx.interesses) {
    if (!inRange(i.data, r)) continue
    const reg = groupOf(i.regiao)
    const cur = map.get(reg) || {
      total: 0,
      atendido: 0,
      espera: 0,
      naoAtendido: 0,
    }
    cur.total++
    if (i.situacao === "atendido") cur.atendido++
    if (i.situacao === "lista_espera") cur.espera++
    if (i.situacao === "nao_atendido") cur.naoAtendido++
    map.set(reg, cur)
  }
  return {
    ...st(m, map.size ? "ok" : "insuficiente"),
    rows: [...map.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.total - a.total),
  }
}
export function regionalEvolution(
  ctx: Ctx,
  top: string[],
  groupOf: (reg: string) => string,
) {
  return top.map((reg) => ({
    label: reg,
    points: ctx.buckets.map((b) => ({
      label: b.label,
      value: ctx.students.filter(
        (a) => groupOf(a.regiao) === reg && isActive(ctx, a, b.end),
      ).length,
    })),
  }))
}

/* ---------- Follow-up ---------- */

export type FollowRow = {
  id: string
  level: "Atenção" | "Acompanhar"
  present: number
  expected: number
  rate: number
  unjust: number
  professor: string
  regiao: string
  signal: string
}
export function followList(ctx: Ctx, r: Range, s: Settings): FollowRow[] {
  const out: FollowRow[] = []
  for (const a of ctx.students) {
    if (!isActive(ctx, a, r.end)) continue
    const list = ctx.partsByAluno.get(a.id) || []
    const pr = presenceOf(list, r)
    if (pr.expected < s.minPrevistas || pr.rate === null) continue
    const lowRate = pr.rate * 100 < s.limiteAtencao
    const manyUnjust = pr.unjust >= s.faltasNaoJustificadas
    if (!lowRate && !manyUnjust) continue
    const last = list.reduce<Part | null>(
      (acc, p) => (!acc || p.e.data > acc.e.data ? p : acc),
      null,
    )
    const reasons = [
      lowRate
        ? `presença de ${Math.round(pr.rate * 100)}% (${pr.present}/${pr.expected})`
        : "",
      manyUnjust ? `${pr.unjust} falta(s) sem justificativa` : "",
    ].filter(Boolean)
    out.push({
      id: a.id,
      level: pr.rate * 100 < s.limiteCritico ? "Atenção" : "Acompanhar",
      present: pr.present,
      expected: pr.expected,
      rate: pr.rate,
      unjust: pr.unjust,
      professor: last?.e.professor || "—",
      regiao: a.regiao,
      signal: reasons.join(" · "),
    })
  }
  return out.sort((a, b) => a.rate - b.rate || b.unjust - a.unjust)
}

/* ---------- Occurrences over time ---------- */

export function occurrenceSeries(ctx: Ctx) {
  return ctx.buckets.map((b) => {
    const c = cancellations(ctx, b)
    const p = presence(ctx, b)
    return {
      label: b.label,
      faltas: p.absent,
      aluno: c.bySide.aluno,
      professor: c.bySide.professor,
      escola: c.bySide.escola + c.bySide.nao_informado,
    }
  })
}

/* ---------- Navigation (kept separate) ---------- */

export function navigation(ctx: Ctx, r: Range) {
  const m = missing(ctx, ["navegacao"])
  const list = ctx.ds.navegacao.filter((n) => inRange(n.day, r))
  const sessions = new Set(list.map((n) => n.session))
  const views = list.filter((n) => n.event === "page_view")
  const count = (xs: string[]) =>
    [
      ...xs
        .reduce(
          (m, x) => m.set(x, (m.get(x) || 0) + 1),
          new Map<string, number>(),
        )
        .entries(),
    ].sort((a, b) => b[1] - a[1])
  const starts = list.filter((n) => n.event === "form_start").length
  const submits = list.filter((n) => n.event === "form_submit").length
  return {
    ...st(m, list.length ? "ok" : "insuficiente"),
    events: list.length,
    sessions: sessions.size,
    views: views.length,
    perSession: sessions.size ? list.length / sessions.size : null,
    paths: count(views.map((v) => v.path)),
    types: count(list.map((v) => v.event)),
    starts,
    submits,
    series: ctx.buckets.map((b) => ({
      label: b.label,
      value: new Set(
        list.filter((n) => inRange(n.day, b)).map((n) => n.session),
      ).size,
    })),
  }
}

/* ---------- Formatting ---------- */

const nf = (d: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
export const fmtPct = (v: number | null, d = 1) =>
  v === null ? "—" : `${nf(d).format(v * 100)}%`
export const fmtNum = (v: number | null, d = 0) =>
  v === null ? "—" : nf(d).format(v)
export const fmtScore = (v: number | null) =>
  v === null ? "—" : nf(2).format(v)

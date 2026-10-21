import { parseDay, parseStamp } from "./dates"
import type {
  Aluno,
  CancelSide,
  Dataset,
  Desistencia,
  Encontro,
  FileKind,
  Interesse,
  InteresseSituacao,
  Navegacao,
  Origem,
  Participacao,
  Avaliacao,
  StudentStatus,
} from "./types"
import { DIMENSIONS } from "./types"

export type Schema = {
  file: string
  label: string
  required: string[]
  optional: string[]
  feeds: string
  origin: string
}
export const SCHEMAS: Record<FileKind, Schema> = {
  alunos: {
    file: "alunos.csv",
    label: "Alunos",
    required: ["id_aluno", "data_ingresso", "status", "regiao"],
    optional: ["data_saida"],
    feeds: "Retenção e região",
    origin: "Matrícula",
  },
  experiencias: {
    file: "experiencias.csv",
    label: "Experiências (encontros)",
    required: [
      "id_experiencia",
      "id_professor",
      "modalidade",
      "data",
      "status",
    ],
    optional: ["motivo_cancelamento", "responsavel_cancelamento"],
    feeds: "Agenda, cancelamentos e qualidade",
    origin: "Agenda",
  },
  participacoes: {
    file: "participacoes.csv",
    label: "Participações",
    required: ["id_experiencia", "id_aluno", "presenca"],
    optional: ["justificativa"],
    feeds: "Presença, frequência e acompanhamento",
    origin: "Participação",
  },
  avaliacoes: {
    file: "avaliacoes.csv",
    label: "Avaliações",
    required: [
      "id_avaliacao",
      "id_experiencia",
      "origem_resposta",
      "data",
      ...DIMENSIONS.map((d) => d.key),
    ],
    optional: [],
    feeds: "Qualidade e engajamento",
    origin: "Avaliação",
  },
  desistencias: {
    file: "desistencias.csv",
    label: "Desistências",
    required: ["id_aluno", "data_desistencia", "categoria_motivo"],
    optional: ["motivo_declarado"],
    feeds: "Evasão e motivos",
    origin: "Matrícula",
  },
  interesses: {
    file: "interesses.csv",
    label: "Interesses (opcional)",
    required: [
      "id_interesse",
      "regiao",
      "modalidade",
      "data_solicitacao",
      "situacao",
    ],
    optional: [],
    feeds: "Demanda regional",
    origin: "Localização agregada",
  },
  navegacao: {
    file: "navegacao.csv",
    label: "Navegação do site",
    required: ["timestamp", "session_id", "event", "path"],
    optional: ["meta"],
    feeds: "Usabilidade da interface (seção separada)",
    origin: "Navegação",
  },
}
export const FILE_KINDS = Object.keys(SCHEMAS) as FileKind[]

/** Lowercase, accent-free, underscore-separated. */
export const norm = (s: string) =>
  s.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")

export function parseCSV(input: string): string[][] {
  const text = input.replace(/^\ufeff/, "")
  const nl = text.search(/\r?\n/)
  const head = nl < 0 ? text : text.slice(0, nl)
  const count = (c: string) => head.split(c).length
  const delim =
    count("\t") > count(";") && count("\t") > count(",")
      ? "\t"
      : count(";") >= count(",")
        ? ";"
        : ","
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) {
      row.push(cell)
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else cell += ch
  }
  if (cell !== "" || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

export function detectKind(
  fileName: string,
  headers: string[],
): FileKind | null {
  const base = norm(fileName.replace(/\.[^.]+$/, ""))
  const byName = FILE_KINDS.find((k) => base.includes(norm(k)))
  if (byName) return byName
  let best: FileKind | null = null
  let score = 0
  for (const k of FILE_KINDS) {
    const s = SCHEMAS[k].required.filter((f) => headers.includes(f)).length
    const ratio = s / SCHEMAS[k].required.length
    if (ratio > score) {
      score = ratio
      best = k
    }
  }
  return score >= 0.6 ? best : null
}

export type ImportReport = {
  fileName: string
  kind: FileKind | null
  headers: string[]
  preview: string[][]
  total: number
  valid: number
  missingColumns: string[]
  discarded: Record<string, number>
  warnings: Record<string, number>
  records: unknown[]
}

const bump = (m: Record<string, number>, k: string) => {
  m[k] = (m[k] || 0) + 1
}
const STATUS: Record<string, StudentStatus> = {
  ativo: "ativo",
  ativa: "ativo",
  active: "ativo",
  matriculado: "ativo",
  desistente: "desistente",
  inativo: "desistente",
  inativa: "desistente",
  desligado: "desistente",
  desligada: "desistente",
  evadido: "desistente",
  cancelado: "desistente",
}
const EXP_STATUS: Record<string, Encontro["status"]> = {
  realizada: "realizada",
  realizado: "realizada",
  concluida: "realizada",
  ocorrida: "realizada",
  cancelada: "cancelada",
  cancelado: "cancelada",
  prevista: "prevista",
  agendada: "prevista",
  programada: "prevista",
}
const SIDE: Record<string, CancelSide> = {
  aluno: "aluno",
  estudante: "aluno",
  responsavel: "aluno",
  familia: "aluno",
  professor: "professor",
  docente: "professor",
  escola: "escola",
  instituicao: "escola",
  administracao: "escola",
}
const ORIGEM: Record<string, Origem> = {
  aluno: "aluno",
  estudante: "aluno",
  participante: "aluno",
  responsavel: "responsavel",
  familia: "responsavel",
  professor: "professor",
}
const PRESENT = new Set(["presente", "sim", "s", "1", "true", "p", "presenca"])
const ABSENT = new Set(["falta", "ausente", "nao", "n", "0", "false", "f"])
const SITUACAO: Record<string, InteresseSituacao> = {
  atendido: "atendido",
  atendida: "atendido",
  matriculado: "atendido",
  inscrito: "atendido",
  lista_de_espera: "lista_espera",
  lista_espera: "lista_espera",
  espera: "lista_espera",
  aguardando: "lista_espera",
  nao_atendido: "nao_atendido",
  sem_vaga: "nao_atendido",
  recusado: "nao_atendido",
  em_analise: "em_analise",
}

export const REASON_CATEGORIES = [
  "Conflito de horário",
  "Deslocamento",
  "Questões pessoais",
  "Experiência não adequada",
  "Indisponibilidade do professor",
  "Estrutura ou calendário da escola",
  "Outros",
  "Não informado",
]
/** Maps a free-text reason to a standard category; the original text is kept separately. */
export function categorize(raw: string): string {
  const t = norm(raw)
  if (!t || t === "nao_informado" || t === "-") return "Não informado"
  const exact = REASON_CATEGORIES.find((c) => norm(c) === t)
  if (exact) return exact
  if (/horari|agenda|compromisso|trabalho|conflito/.test(t))
    return "Conflito de horário"
  if (/desloc|transporte|distan|transito|onibus|longe/.test(t))
    return "Deslocamento"
  if (/pessoa|famil|particular/.test(t)) return "Questões pessoais"
  if (/expectativ|adequad|gostou|interesse/.test(t))
    return "Experiência não adequada"
  if (/professor|docente/.test(t)) return "Indisponibilidade do professor"
  if (/escola|espaco|sala|manutenc|feriado|evento|calendario/.test(t))
    return "Estrutura ou calendário da escola"
  return "Outros"
}

type Row = Record<string, string>
type Converter = (
  r: Row,
  warn: (w: string) => void,
) => {
  ok: unknown
  key: string
} | { error: string }

const CONVERTERS: Record<FileKind, Converter> = {
  alunos: (r, warn) => {
    if (!r.id_aluno) return { error: "Identificador do aluno ausente" }
    const ingresso = parseDay(r.data_ingresso || "")
    if (ingresso === null) return { error: "Data de ingresso inválida" }
    let saida = r.data_saida ? parseDay(r.data_saida) : null
    if (r.data_saida && saida === null) {
      warn("Data de saída inválida (ignorada)")
      saida = null
    }
    if (saida !== null && saida < ingresso)
      return { error: "Saída anterior ao ingresso" }
    let status = STATUS[norm(r.status || "")]
    if (!status) {
      warn("Situação desconhecida (mantida como “outra”)")
      status = "outro"
    }
    if (!r.regiao) warn("Região não informada")
    const a: Aluno = {
      id: r.id_aluno,
      ingresso,
      saida,
      status,
      regiao: r.regiao || "Não informada",
    }
    return { ok: a, key: r.id_aluno }
  },
  experiencias: (r, warn) => {
    if (!r.id_experiencia)
      return { error: "Identificador da experiência ausente" }
    const data = parseDay(r.data || "")
    if (data === null) return { error: "Data inválida" }
    const status = EXP_STATUS[norm(r.status || "")]
    if (!status) return { error: "Situação do encontro desconhecida" }
    let responsavel: CancelSide | null = null
    if (status === "cancelada") {
      responsavel =
        SIDE[norm(r.responsavel_cancelamento || "")] || "nao_informado"
      if (responsavel === "nao_informado")
        warn("Cancelamento sem responsável identificado")
    }
    if (!r.id_professor) warn("Professor não informado")
    const e: Encontro = {
      id: r.id_experiencia,
      professor: r.id_professor || "Não informado",
      modalidade: r.modalidade || "Não informada",
      data,
      status,
      motivo: r.motivo_cancelamento || "",
      responsavel,
    }
    return { ok: e, key: r.id_experiencia }
  },
  participacoes: (r, warn) => {
    if (!r.id_experiencia || !r.id_aluno)
      return { error: "Experiência ou aluno ausente" }
    const p = norm(r.presenca || "")
    let presente: boolean | null = null
    if (PRESENT.has(p)) presente = true
    else if (ABSENT.has(p)) presente = false
    else if (p && p !== "cancelada" && p !== "cancelado")
      warn("Presença com valor desconhecido (não contabilizada)")
    const v: Participacao = {
      exp: r.id_experiencia,
      aluno: r.id_aluno,
      presente,
      justificativa: r.justificativa || "",
    }
    return { ok: v, key: `${r.id_experiencia}|${r.id_aluno}` }
  },
  avaliacoes: (r, warn) => {
    if (!r.id_avaliacao || !r.id_experiencia)
      return { error: "Identificador ausente" }
    const origem = ORIGEM[norm(r.origem_resposta || "")]
    if (!origem) return { error: "Origem da resposta desconhecida" }
    const data = parseDay(r.data || "")
    if (data === null) return { error: "Data inválida" }
    const notas = DIMENSIONS.map((d) => {
      const raw = (r[d.key] || "").replace(",", ".").trim()
      if (!raw) return null
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        warn("Nota fora da escala 1–5 (ignorada)")
        return null
      }
      return n
    })
    if (notas.every((n) => n === null)) return { error: "Nenhuma nota válida" }
    const a: Avaliacao = {
      id: r.id_avaliacao,
      exp: r.id_experiencia,
      origem,
      data,
      notas,
    }
    return { ok: a, key: r.id_avaliacao }
  },
  desistencias: (r) => {
    if (!r.id_aluno) return { error: "Identificador do aluno ausente" }
    const data = parseDay(r.data_desistencia || "")
    if (data === null) return { error: "Data de desistência inválida" }
    const d: Desistencia = {
      aluno: r.id_aluno,
      data,
      categoria: categorize(r.categoria_motivo || ""),
      declarado: r.motivo_declarado || "",
    }
    return { ok: d, key: `${r.id_aluno}|${data}` }
  },
  interesses: (r, warn) => {
    if (!r.id_interesse) return { error: "Identificador ausente" }
    const data = parseDay(r.data_solicitacao || "")
    if (data === null) return { error: "Data de solicitação inválida" }
    let situacao = SITUACAO[norm(r.situacao || "")]
    if (!situacao) {
      warn("Situação desconhecida (tratada como “em análise”)")
      situacao = "em_analise"
    }
    const i: Interesse = {
      id: r.id_interesse,
      regiao: r.regiao || "Não informada",
      modalidade: r.modalidade || "Não informada",
      data,
      situacao,
    }
    return { ok: i, key: r.id_interesse }
  },
  navegacao: (r) => {
    const day = parseStamp(r.timestamp || "")
    if (day === null) return { error: "Timestamp inválido" }
    const n: Navegacao = {
      day,
      session: r.session_id || "sem-sessao",
      event: r.event || "desconhecido",
      path: r.path || "/",
    }
    return { ok: n, key: "" }
  },
}

/** Parses and validates one CSV. `forced` overrides auto-detection (manual mapping). */
export function readFile(
  fileName: string,
  text: string,
  forced?: FileKind | null,
): ImportReport {
  const rows = parseCSV(text)
  const headers = (rows[0] || []).map(norm)
  const body = rows.slice(1)
  const kind = forced === undefined ? detectKind(fileName, headers) : forced
  const report: ImportReport = {
    fileName,
    kind,
    headers,
    preview: body.slice(0, 5),
    total: body.length,
    valid: 0,
    missingColumns: [],
    discarded: {},
    warnings: {},
    records: [],
  }
  if (!kind) return report
  report.missingColumns = SCHEMAS[kind].required.filter(
    (f) => !headers.includes(f),
  )
  if (report.missingColumns.length) {
    if (body.length)
      report.discarded["Colunas obrigatórias ausentes"] = body.length
    return report
  }
  const seen = new Set<string>()
  for (const cells of body) {
    // More fields than headers means an unquoted delimiter shifted the columns.
    if (cells.length > headers.length) {
      bump(report.discarded, "Mais colunas que o cabeçalho (verifique aspas)")
      continue
    }
    const r: Row = {}
    headers.forEach((h, i) => (r[h] = (cells[i] ?? "").trim()))
    const res = CONVERTERS[kind](r, (w) => bump(report.warnings, w))
    if ("error" in res) {
      bump(report.discarded, res.error)
      continue
    }
    if (res.key) {
      if (seen.has(res.key)) {
        bump(report.discarded, "Registro duplicado")
        continue
      }
      seen.add(res.key)
    }
    report.records.push(res.ok)
  }
  report.valid = report.records.length
  return report
}

/** Builds a dataset only from imported files; demo data is never mixed in. */
export function buildDataset(reports: ImportReport[], refDay: number): {
  dataset: Dataset
  integrity: string[]
} {
  const pick = <T>(k: FileKind) =>
    reports
      .filter((r) => r.kind === k && r.valid > 0)
      .flatMap((r) => r.records as T[])
  const ds: Dataset = {
    origin: "importado",
    loadedAt: new Date().toISOString(),
    refDay,
    available: FILE_KINDS.filter((k) =>
      reports.some((r) => r.kind === k && r.valid > 0),
    ),
    alunos: pick<Aluno>("alunos"),
    encontros: pick<Encontro>("experiencias"),
    participacoes: pick<Participacao>("participacoes"),
    avaliacoes: pick<Avaliacao>("avaliacoes"),
    desistencias: pick<Desistencia>("desistencias"),
    interesses: pick<Interesse>("interesses"),
    navegacao: pick<Navegacao>("navegacao"),
  }
  const integrity: string[] = []
  const alunoIds = new Set(ds.alunos.map((a) => a.id))
  const expIds = new Set(ds.encontros.map((e) => e.id))
  if (ds.alunos.length && ds.participacoes.length) {
    const before = ds.participacoes.length
    ds.participacoes = ds.participacoes.filter(
      (p) => alunoIds.has(p.aluno) && (!expIds.size || expIds.has(p.exp)),
    )
    const lost = before - ds.participacoes.length
    if (lost)
      integrity.push(
        `${lost} participação(ões) sem aluno ou experiência correspondente foram desconsideradas.`,
      )
  }
  if (ds.alunos.length && ds.desistencias.length) {
    const before = ds.desistencias.length
    ds.desistencias = ds.desistencias.filter((d) => alunoIds.has(d.aluno))
    const lost = before - ds.desistencias.length
    if (lost)
      integrity.push(
        `${lost} desistência(s) de alunos ausentes em alunos.csv foram desconsideradas.`,
      )
  }
  if (expIds.size && ds.avaliacoes.length) {
    const before = ds.avaliacoes.length
    ds.avaliacoes = ds.avaliacoes.filter((a) => expIds.has(a.exp))
    const lost = before - ds.avaliacoes.length
    if (lost)
      integrity.push(
        `${lost} avaliação(ões) sem experiência correspondente foram desconsideradas.`,
      )
  }
  return { dataset: ds, integrity }
}

export function templateCSV(kind: FileKind) {
  const s = SCHEMAS[kind]
  return [...s.required, ...s.optional].join(";") + "\r\n"
}

export function downloadCSV(name: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n")
  downloadText(name, "\ufeff" + csv, "text/csv;charset=utf-8")
}
export function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

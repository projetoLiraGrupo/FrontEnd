import { categorize } from "./csv"
import { today } from "./dates"
import type {
  Aluno,
  Avaliacao,
  CancelSide,
  Dataset,
  Desistencia,
  Encontro,
  Interesse,
  Navegacao,
  Origem,
  Participacao,
} from "./types"

/** Small seeded PRNG so the demonstration is stable between visits. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TEACHERS = [
  {
    id: "Rafael Costa",
    mod: "Piano & descoberta",
    base: 4.45,
    group: false,
    w: 5,
  },
  {
    id: "Beatriz Lima",
    mod: "Cordas que conectam",
    base: 4.3,
    group: false,
    w: 4,
  },
  {
    id: "Thiago Nunes",
    mod: "Cordas que conectam",
    base: 4.1,
    group: false,
    w: 3,
    recent: true,
  },
  {
    id: "Camila Santos",
    mod: "Voz em movimento",
    base: 4.55,
    group: false,
    w: 4,
  },
  {
    id: "Gabriel Mendes",
    mod: "Corpo, som e ritmo",
    base: 4.2,
    group: true,
    w: 4,
  },
  {
    id: "Ana Ribeiro",
    mod: "Corpo, som e ritmo",
    base: 3.85,
    group: true,
    w: 3,
  },
]
/** [region, weight among students, access difficulty, demand weight, share served] */
const REGIONS: [string, number, number, number, number][] = [
  ["Pinheiros", 14, 0.8, 8, 0.75],
  ["Vila Mariana", 13, 0.85, 8, 0.72],
  ["Lapa", 9, 0.9, 6, 0.7],
  ["Butantã", 10, 1, 7, 0.62],
  ["Mooca", 10, 1, 7, 0.6],
  ["Santana", 8, 1.05, 6, 0.58],
  ["Itaquera", 8, 1.5, 14, 0.34],
  ["Capão Redondo", 7, 1.6, 13, 0.3],
  ["Osasco (município)", 6, 1.35, 8, 0.4],
  ["Guarulhos (município)", 5, 1.45, 8, 0.38],
  ["Parelheiros", 1, 1.7, 3, 0.25],
]
const STUDENT_REASONS: [string, string[]][] = [
  [
    "Conflito de horário",
    [
      "Mudou o horário do trabalho",
      "Prova na escola",
      "Compromisso no mesmo horário",
    ],
  ],
  ["Deslocamento", ["Transporte atrasou", "Trânsito intenso", "Sem carona"]],
  ["Questões pessoais", ["Compromisso familiar", "Motivo pessoal"]],
  ["Não informado", [""]],
]
const EXIT_REASONS: [string, string[]][] = [
  [
    "Conflito de horário",
    ["Novo emprego no horário das experiências", "Mudança de turno escolar"],
  ],
  ["Deslocamento", ["Distância até a escola", "Custo do transporte"]],
  ["Questões pessoais", ["Mudança de cidade", "Prefere não detalhar"]],
  [
    "Experiência não adequada",
    ["Esperava outra proposta", "Ritmo diferente do esperado"],
  ],
  ["Não informado", [""]],
]
const PATHS = [
  "/",
  "/experiencias",
  "/escola",
  "/professores",
  "/contato",
  "/entrar",
  "/cadastro",
  "/perfil-musical",
]

export function generateDemo(): Dataset {
  const r = rng(20240521)
  const ref = today()
  const start = ref - 540
  const pick = <T>(list: T[]) => list[Math.floor(r() * list.length)]
  const weighted = <T>(list: T[], w: (x: T) => number) => {
    const total = list.reduce((s, x) => s + w(x), 0)
    let u = r() * total
    for (const x of list) {
      u -= w(x)
      if (u <= 0) return x
    }
    return list[list.length - 1]
  }
  const normal = () => (r() + r() + r() + r() - 2) * 0.85

  type Sim = Aluno & {
    teacher: typeof TEACHERS[number]
    p: number
    risk: number
  }
  const sims: Sim[] = []
  const desistencias: Desistencia[] = []
  for (let i = 0; i < 290; i++) {
    const ingresso = Math.floor(start + Math.pow(r(), 0.85) * (ref - 4 - start))
    const region = weighted(REGIONS, (x) => x[1])
    const pool = TEACHERS.filter((t) => !t.recent || ingresso > ref - 75)
    const teacher = weighted(pool, (t) => t.w)
    const risk = region[2] * (teacher.id === "Ana Ribeiro" ? 1.25 : 1)
    const p = Math.min(0.98, 0.62 + r() * 0.36 - (region[2] - 1) * 0.06)
    let exit: number | null = null
    for (let m = 0; ingresso + m * 30 < ref; m++) {
      const h = 0.019 * risk * (p < 0.74 ? 2 : 1) * (m < 2 ? 1.4 : 1)
      if (r() < h) {
        exit = Math.min(ref - 1, ingresso + m * 30 + Math.floor(r() * 30))
        break
      }
    }
    const id = `AL-${String(i + 1).padStart(3, "0")}`
    sims.push({
      id,
      ingresso,
      saida: exit,
      status: exit === null ? "ativo" : "desistente",
      regiao: region[0],
      teacher,
      p,
      risk,
    })
    if (exit !== null) {
      const [cat, texts] = weighted(EXIT_REASONS, ([c]) =>
        c === "Deslocamento"
          ? 9 * risk * risk
          : c === "Experiência não adequada"
            ? teacher.id === "Ana Ribeiro"
              ? 18
              : 9
            : c === "Conflito de horário"
              ? 28
              : c === "Questões pessoais"
                ? 20
                : 13,
      )
      desistencias.push({
        aluno: id,
        data: exit,
        categoria: cat,
        declarado: pick(texts),
      })
    }
  }

  const encontros: Encontro[] = []
  const participacoes: Participacao[] = []
  const avaliacoes: Avaliacao[] = []
  let expN = 0
  let avN = 0
  const active = (s: Sim, d: number) =>
    s.ingresso <= d && (s.saida === null || s.saida > d)
  const presence = (s: Sim, d: number) =>
    s.saida !== null && s.saida - d < 42 ? s.p * 0.72 : s.p
  const score = (base: number, offset: number) =>
    Math.max(1, Math.min(5, Math.round(base + offset + normal())))
  const evaluate = (
    exp: Encontro,
    s: Sim | null,
    teacherBase: number,
    origem: Origem,
  ) => {
    const p = s ? s.p : 0.82
    const b = teacherBase + (p - 0.8) * 1.4
    avaliacoes.push({
      id: `AV-${String(++avN).padStart(5, "0")}`,
      exp: exp.id,
      origem,
      data: exp.data + (r() < 0.5 ? 0 : 1 + Math.floor(r() * 3)),
      notas: [
        score(b, 0.15),
        score(b, -0.05),
        score(b, 0.05),
        score(teacherBase + (p - 0.8) * 3.2, -0.15),
        score(b, -0.3),
      ],
    })
  }
  const newEncontro = (t: typeof TEACHERS[number], data: number) => {
    const cancelled = r() < 0.058
    let responsavel: CancelSide | null = null
    let motivo = ""
    if (cancelled) {
      const u = r()
      responsavel =
        !t.group && u < 0.46 ? "aluno" : u < 0.74 ? "professor" : "escola"
      if (r() < 0.05) responsavel = "nao_informado"
      if (responsavel === "professor")
        motivo = pick([
          "Compromisso do professor",
          "Professor em formação externa",
        ])
      else if (responsavel === "escola")
        motivo = pick([
          "Manutenção da sala",
          "Feriado municipal",
          "Evento da escola",
        ])
    }
    const e: Encontro = {
      id: `EX-${String(++expN).padStart(5, "0")}`,
      professor: t.id,
      modalidade: t.mod,
      data,
      status: cancelled ? "cancelada" : "realizada",
      motivo,
      responsavel,
    }
    encontros.push(e)
    return e
  }
  const attend = (e: Encontro, s: Sim) => {
    if (e.status === "cancelada") {
      participacoes.push({
        exp: e.id,
        aluno: s.id,
        presente: null,
        justificativa: "",
      })
      return false
    }
    const present = r() < presence(s, e.data)
    participacoes.push({
      exp: e.id,
      aluno: s.id,
      presente: present,
      justificativa:
        !present && r() < 0.4
          ? pick(["Aviso prévio enviado", "Compromisso familiar", "Viagem"])
          : "",
    })
    return present
  }

  for (let week = start; week < ref; week += 7) {
    for (const t of TEACHERS) {
      const group = sims.filter((s) => s.teacher === t && active(s, week + 3))
      if (!group.length) continue
      if (t.group) {
        if (week + 5 >= ref) continue
        for (const slot of [0, 1]) {
          const members = group.filter((_, i) => i % 2 === slot)
          if (!members.length) continue
          const e = newEncontro(t, week + 5)
          members.forEach((s) => {
            if (attend(e, s) && r() < 0.14)
              evaluate(e, s, t.base, r() < 0.7 ? "aluno" : "responsavel")
          })
          if (e.status === "realizada" && r() < 0.2)
            evaluate(e, null, t.base + 0.1, "professor")
        }
      } else {
        for (const s of group) {
          const day = week + (s.id.charCodeAt(5) % 5)
          if (day >= ref) continue
          const e = newEncontro(t, day)
          if (e.status === "cancelada" && e.responsavel === "aluno") {
            const [cat, texts] = weighted(STUDENT_REASONS, ([c]) =>
              c === "Deslocamento"
                ? 18 * s.risk
                : c === "Conflito de horário"
                  ? 36
                  : c === "Questões pessoais"
                    ? 24
                    : 14,
            )
            e.motivo = cat === "Não informado" ? "" : pick(texts)
          }
          if (attend(e, s)) {
            if (r() < 0.21)
              evaluate(e, s, t.base, r() < 0.68 ? "aluno" : "responsavel")
            if (r() < 0.05) evaluate(e, s, t.base + 0.1, "professor")
          }
        }
      }
    }
  }

  const interesses: Interesse[] = []
  for (let i = 0; i < 380; i++) {
    const region = weighted(REGIONS, (x) => x[3])
    const t = pick(TEACHERS)
    const u = r()
    interesses.push({
      id: `IN-${String(i + 1).padStart(4, "0")}`,
      regiao: region[0],
      modalidade: t.mod,
      data: Math.floor(start + Math.pow(r(), 0.8) * (ref - start)),
      situacao:
        u < region[4]
          ? "atendido"
          : u < region[4] + (1 - region[4]) * 0.55
            ? "lista_espera"
            : "nao_atendido",
    })
  }

  const navegacao: Navegacao[] = []
  for (let sIdx = 0; sIdx < 520; sIdx++) {
    const day = ref - Math.floor(r() * 120)
    const session = `s-${(sIdx * 7919).toString(36)}`
    const steps = 2 + Math.floor(r() * 6)
    for (let k = 0; k < steps; k++) {
      const path =
        k === 0 ? weighted(PATHS, (p) => (p === "/" ? 8 : 2)) : pick(PATHS)
      navegacao.push({ day, session, event: "page_view", path })
      if (r() < 0.3)
        navegacao.push({
          day,
          session,
          event: path === "/cadastro" ? "form_start" : "click_cta",
          path,
        })
      if (path === "/cadastro" && r() < 0.35)
        navegacao.push({ day, session, event: "form_submit", path })
    }
  }

  return {
    origin: "demo",
    loadedAt: new Date().toISOString(),
    refDay: ref - 1,
    available: [
      "alunos",
      "experiencias",
      "participacoes",
      "avaliacoes",
      "desistencias",
      "interesses",
      "navegacao",
    ],
    alunos: sims.map(({ id, ingresso, saida, status, regiao }) => ({
      id,
      ingresso,
      saida,
      status,
      regiao,
    })),
    encontros,
    participacoes,
    avaliacoes,
    desistencias: desistencias.map((d) => ({
      ...d,
      categoria: categorize(d.categoria),
    })),
    interesses,
    navegacao,
  }
}

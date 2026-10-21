/* ---------- Modelo: questionário de perfis e matriz de compatibilidade ---------- */
export const STUDENT_PROFILES = [
  {
    id: "A1",
    name: "Lazer e bem-estar",
    desc: "Busca prazer, relaxamento e realização pessoal por meio da música.",
    qs: [
      "Aprender música é uma forma de me divertir.",
      "Prefiro experiências leves, sem muitas cobranças.",
      "Quero aprender música principalmente como um passatempo.",
      "Prefiro aproveitar os encontros sem me preocupar com resultados rápidos.",
    ],
  },
  {
    id: "A2",
    name: "Focado em evolução",
    desc: "Valoriza técnica, desafios, metas e progresso.",
    qs: [
      "Gosto de estabelecer metas para melhorar na música.",
      "Quero perceber minha evolução ao longo dos encontros.",
      "Gosto de exercícios musicais desafiadores.",
      "Estou disposto(a) a praticar com frequência para melhorar.",
    ],
  },
  {
    id: "A3",
    name: "Familiar",
    desc: "Valoriza o incentivo e o acompanhamento da família no aprendizado.",
    qs: [
      "O incentivo da minha família me motiva a estudar música.",
      "Gosto quando minha família acompanha meu aprendizado.",
      "Compartilhar meu progresso musical com a família é importante para mim.",
      "O apoio da minha família me ajuda a continuar estudando música.",
    ],
  },
  {
    id: "A4",
    name: "Social e de experiências",
    desc: "Valoriza atividades coletivas e experiências musicais compartilhadas.",
    qs: [
      "Gosto de tocar música com outras pessoas.",
      "Tenho vontade de participar de apresentações musicais.",
      "Prefiro atividades musicais em grupo.",
      "Gosto de conhecer pessoas através da música.",
    ],
  },
  {
    id: "A5",
    name: "Acompanhamento personalizado",
    desc: "Valoriza estratégias ajustadas ao ritmo e às necessidades individuais.",
    qs: [
      "Tenho dificuldade quando preciso aprender no mesmo ritmo que outras pessoas.",
      "Às vezes, preciso de mais tempo para aprender algo novo.",
      "Entendo melhor quando o professor explica de maneiras diferentes.",
      "Preciso que as atividades sejam adaptadas às minhas dificuldades.",
    ],
  },
]
export const TEACHER_PROFILES = [
  "Acolhedor e motivador",
  "Técnico e estruturado",
  "Lúdico e infantojuvenil",
  "Integrador e artístico",
  "Ensino adaptativo",
]

/** R[i][j]: relação pedagógica entre perfil de aluno i e perfil de professor j, em [-2, +2]. */
export const R = [
  [2, 0, 0.5, 1, 0.5],
  [0.5, 2, 0, 0.5, 1],
  [1, -0.5, 2, 0, 0.5],
  [1, 0.5, 0, 2, 0.5],
  [0.5, 0.5, 1, 0, 2],
]

export const SCALE: [number, string][] = [
  [-2, "Discordo totalmente"],
  [-1, "Discordo parcialmente"],
  [0, "Neutro(a)"],
  [1, "Concordo parcialmente"],
  [2, "Concordo totalmente"],
]

/* Dados mockados */
export const TEACHERS = [
  {
    name: "Professor(a) 01",
    inst: "Piano",
    bio: "Ensino adaptável ao nível e às preferências de aprendizagem, com apoio visual.",
    slot: "Seg e qua · manhã",
    P: [0.5, 0.3, 0.3, 0.1, 0.9],
  },
  {
    name: "Professor(a) 02",
    inst: "Violão",
    bio: "Rotina previsível, orientação passo a passo e metas definidas a cada mês.",
    slot: "Ter e qui · tarde",
    P: [0.2, 0.9, 0, 0.2, 0.4],
  },
  {
    name: "Professor(a) 03",
    inst: "Canto",
    bio: "Repertório coletivo, ensaios em grupo e apresentações ao longo do semestre.",
    slot: "Qua e sex · tarde",
    P: [0.6, 0.2, 0.1, 0.9, 0.3],
  },
  {
    name: "Professor(a) 04",
    inst: "Piano",
    bio: "Jogos musicais e devolutivas frequentes para alunos e famílias.",
    slot: "Ter e sex · tarde",
    P: [0.7, 0.1, 0.9, 0.3, 0.4],
  },
  {
    name: "Professor(a) 05",
    inst: "Violão",
    bio: "Encontros leves e acolhedoras, centradas no prazer de tocar.",
    slot: "Sábado · manhã",
    P: [0.9, 0.2, 0.4, 0.5, 0.3],
  },
]
export const EXAMPLE_ANSWERS = [
  1, 1, 0, 1, 0, 1, -1, 0, 2, 2, 1, 2, 1, 2, 0, 1, 1, 2, 2, 1,
]

/* Fórmulas */
export function intensities(ans: (number | null)[]) {
  return STUDENT_PROFILES.map((_, i) => {
    const m =
      ans.slice(i * 4, i * 4 + 4).reduce<number>((s, v) => s + (v ?? 0), 0) / 4 // M_i
    return Math.max(0, m) / 2 // A_i
  })
}
export function compatibility(A: number[], P: number[]) {
  const parts = A.flatMap((a, i) =>
    P.map((p, j) => ({ i, j, v: a * p * R[i][j] })),
  ) // I_ij
  const S = parts.reduce((s, x) => s + x.v, 0)
  const W = A.reduce((s, x) => s + x, 0) * P.reduce((s, x) => s + x, 0)
  const pos = parts.filter((x) => x.v > 0).reduce((s, x) => s + x.v, 0)
  const neg = parts.filter((x) => x.v < 0).reduce((s, x) => s + x.v, 0)
  const sorted = [...parts].sort((a, b) => b.v - a.v)
  return {
    C: W > 0 ? S / W : null,
    S,
    W,
    pos,
    neg,
    top: sorted.filter((x) => x.v > 0).slice(0, 2),
    worst: sorted.filter((x) => x.v < 0).at(-1),
  }
}

export const num = (n: number, d = 2) =>
  Math.abs(n).toLocaleString("pt-BR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
export const signed = (n: number, d = 2) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${num(n, d)}`
export const band = (c: number) =>
  c >= 1.2 ? "Muito alta" : c >= 0.8 ? "Alta" : c >= 0.4 ? "Moderada" : "Baixa"

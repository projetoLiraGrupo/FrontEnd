/** Day index: whole days since 1970-01-01 (UTC). Keeps date math cheap and timezone-free. */
export type Day = number

export type FileKind = "alunos" | "experiencias" | "participacoes" | "avaliacoes" | "desistencias" | "interesses" | "navegacao"

export type StudentStatus = "ativo" | "desistente" | "outro"
export type Aluno = {
  id: string
  ingresso: Day
  saida: Day | null
  status: StudentStatus
  regiao: string
}
export type CancelSide = "aluno" | "professor" | "escola" | "nao_informado"
export type Encontro = {
  id: string
  professor: string
  modalidade: string
  data: Day
  status: "realizada" | "cancelada" | "prevista"
  motivo: string
  responsavel: CancelSide | null
}
export type Participacao = {
  exp: string
  aluno: string
  /** null = not applicable (e.g. cancelled meeting) or not recorded */
  presente: boolean | null
  justificativa: string
}
export type Origem = "aluno" | "responsavel" | "professor"
export type Avaliacao = {
  id: string
  exp: string
  origem: Origem
  data: Day
  /** acolhimento, clareza, incentivo, interesse_continuar, evolucao_percebida */
  notas: (number | null)[]
}
export type Desistencia = {
  aluno: string
  data: Day
  categoria: string
  declarado: string
}
export type InteresseSituacao = "atendido" | "lista_espera" | "nao_atendido" | "em_analise"
export type Interesse = {
  id: string
  regiao: string
  modalidade: string
  data: Day
  situacao: InteresseSituacao
}
export type Navegacao = {
  day: Day
  session: string
  event: string
  path: string
}

export type Dataset = {
  origin: "demo" | "importado"
  loadedAt: string
  refDay: Day
  available: FileKind[]
  alunos: Aluno[]
  encontros: Encontro[]
  participacoes: Participacao[]
  avaliacoes: Avaliacao[]
  desistencias: Desistencia[]
  interesses: Interesse[]
  navegacao: Navegacao[]
}

export type PeriodKey = "7d" | "30d" | "90d" | "12m" | "custom"
export type Filters = {
  period: PeriodKey
  from: string
  to: string
  regiao: string
  professor: string
  modalidade: string
  situacao: "todos" | "ativo" | "desistente"
  ingresso: "todas" | "ate3" | "3a12" | "mais12"
}

export type Settings = {
  metaRetencao: number
  metaPresenca: number
  limiteCancelamento: number
  metaSatisfacao: number
  metaResposta: number
  limiteAtencao: number
  limiteCritico: number
  minPrevistas: number
  faltasNaoJustificadas: number
  amostraMinima: number
  minRegiao: number
}

export type FollowState = "pendente" | "em_contato" | "resolvida"
export type FollowUp = {
  estado: FollowState
  responsavel: string
  ultimoContato: string
}

export const DIMENSIONS = [
  {
    key: "acolhimento",
    label: "Acolhimento",
    question: "A experiência foi acolhedora e confortável para o participante.",
  },
  {
    key: "clareza",
    label: "Clareza e adequação",
    question:
      "As atividades foram claras e adequadas às suas necessidades e interesses.",
  },
  {
    key: "incentivo",
    label: "Incentivo à participação",
    question:
      "O professor incentivou a participação e respeitou o ritmo de aprendizagem.",
  },
  {
    key: "interesse_continuar",
    label: "Interesse em continuar",
    question: "O participante sentiu interesse em continuar explorando música.",
  },
  {
    key: "evolucao_percebida",
    label: "Evolução percebida",
    question: "O participante percebeu progresso ou descobriu algo novo.",
  },
] as const

export const ORIGEM_LABEL: Record<Origem, string> = {
  aluno: "Aluno",
  responsavel: "Responsável",
  professor: "Professor",
}
export const SIDE_LABEL: Record<CancelSide, string> = {
  aluno: "Pelo aluno",
  professor: "Pelo professor",
  escola: "Pela escola",
  nao_informado: "Origem não informada",
}

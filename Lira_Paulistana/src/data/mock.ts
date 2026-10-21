export type Role = "aluno" | "professor" | "admin"
export type Go = (path: string) => void
export type Account = {
  role: Role
  email: string
  name: string
  password: string
}
export type RequestStatus = "Pendente" | "Confirmada" | "Recusada"
export type Enrollment = {
  id: number
  experienceId: string
  name: string
  status: RequestStatus
}
export type Plan = {
  id: number
  student: string
  title: string
  goal: string
}
export type Material = {
  id: number
  title: string
  type: string
}
export type Message = {
  id: number
  from: string
  text: string
  date: string
}
export type DemoData = {
  enrollments: Enrollment[]
  approvedTeachers: Record<string, RequestStatus>
  plans: Plan[]
  materials: Material[]
  messages: Message[]
  feedback: string
}

export const accounts: Account[] = [
  {
    role: "aluno",
    email: "aluno@lira.demo",
    password: "demo123",
    name: "Marina Alves",
  },
  {
    role: "professor",
    email: "professor@lira.demo",
    password: "demo123",
    name: "Rafael Costa",
  },
  {
    role: "admin",
    email: "admin@lira.demo",
    password: "demo123",
    name: "Davi Oliveira",
  },
]
export const roleInfo: Record<Role, {
  label: string
  area: string
  initial: string
}> = {
  aluno: { label: "Aluno", area: "Minha jornada", initial: "/aluno" },
  professor: {
    label: "Professor",
    area: "Espaço do professor",
    initial: "/professor",
  },
  admin: { label: "Administrador", area: "Gestão da Lira", initial: "/admin" },
}
export const experiences = [
  {
    id: "piano",
    icon: "piano",
    name: "Piano & descoberta",
    kind: "Instrumental",
    duration: "50 min",
    level: "Todos os níveis",
    description:
      "Experimente melodias, perceba ritmos e encontre sua própria expressão nas teclas.",
    days: "Terças e sextas",
    detail: "Sinta a música começar em suas mãos, nota por nota.",
    tone: "blue",
  },
  {
    id: "violao",
    icon: "guitar",
    name: "Cordas que conectam",
    kind: "Instrumental",
    duration: "50 min",
    level: "Iniciantes",
    description:
      "Explore acordes, canções e a liberdade de criar seu próprio som.",
    days: "Segundas e quartas",
    detail: "Seu primeiro acorde pode ser o começo de tudo.",
    tone: "purple",
  },
  {
    id: "canto",
    icon: "mic",
    name: "Voz em movimento",
    kind: "Vocal",
    duration: "50 min",
    level: "Todos os níveis",
    description:
      "Descubra a potência da sua voz em um espaço seguro para se expressar.",
    days: "Quartas e sábados",
    detail: "A sua voz merece espaço para existir.",
    tone: "peach",
  },
  {
    id: "ritmo",
    icon: "sparkles",
    name: "Corpo, som e ritmo",
    kind: "Coletiva",
    duration: "60 min",
    level: "Livre",
    description:
      "Viva o pulso da música pelo corpo, pelo movimento e pela criação em grupo.",
    days: "Sábados",
    detail: "Música que se sente antes de explicar.",
    tone: "mint",
  },
] as const
export const teachers = [
  {
    id: "r",
    name: "Rafael Costa",
    area: "Piano e criação musical",
    initials: "RC",
    bio: "Escuta, repertório afetivo e descobertas no tempo de cada pessoa.",
    tag: "Expressão & acolhimento",
  },
  {
    id: "b",
    name: "Beatriz Lima",
    area: "Violão e musicalização",
    initials: "BL",
    bio: "Encontros que combinam liberdade para experimentar e caminhos claros.",
    tag: "Experimentação & prática",
  },
  {
    id: "c",
    name: "Camila Santos",
    area: "Canto e expressão vocal",
    initials: "CS",
    bio: "Um espaço de confiança para explorar timbres, presença e identidade.",
    tag: "Voz & confiança",
  },
]
export const initialData: DemoData = {
  enrollments: [
    {
      id: 1,
      experienceId: "piano",
      name: "Marina Alves",
      status: "Confirmada",
    },
  ],
  approvedTeachers: {
    "Beatriz Lima": "Pendente",
    "Gabriel Mendes": "Pendente",
  },
  plans: [
    {
      id: 1,
      student: "Marina Alves",
      title: "Explorar ritmos no piano",
      goal: "Descobrir pulsação com música favorita",
    },
  ],
  materials: [
    { id: 1, title: "Sua primeira melodia", type: "Áudio + transcrição" },
    { id: 2, title: "Ritmo no cotidiano", type: "Guia de prática" },
  ],
  messages: [
    {
      id: 1,
      from: "Rafael",
      text: "Marina, separe uma música que você ama para nosso próximo encontro!",
      date: "Hoje, 09:20",
    },
  ],
  feedback: "",
}
type NavItem = {
  title: string
  icon: string
  path: string
}
export const nav: Record<Role, NavItem[]> = {
  aluno: [
    { title: "Visão geral", icon: "home", path: "/aluno" },
    {
      title: "Explorar experiências",
      icon: "sparkles",
      path: "/aluno/experiencias",
    },
    { title: "Minha agenda", icon: "calendar", path: "/aluno/agenda" },
    { title: "Minha jornada", icon: "compass", path: "/aluno/jornada" },
    { title: "Mensagens", icon: "message", path: "/aluno/mensagens" },
    { title: "Meu perfil musical", icon: "user", path: "/aluno/perfil" },
  ],
  professor: [
    { title: "Visão geral", icon: "home", path: "/professor" },
    { title: "Minha agenda", icon: "calendar", path: "/professor/agenda" },
    {
      title: "Participantes",
      icon: "users",
      path: "/professor/participantes",
    },
    {
      title: "Criar experiência",
      icon: "sparkles",
      path: "/professor/criar",
    },
    { title: "Materiais", icon: "folder", path: "/professor/materiais" },
    { title: "Mensagens", icon: "message", path: "/professor/mensagens" },
  ],
  admin: [
    { title: "Visão geral", icon: "home", path: "/admin" },
    { title: "Retenção", icon: "trend", path: "/admin/retencao" },
    {
      title: "Experiências e professores",
      icon: "star",
      path: "/admin/experiencias",
    },
    { title: "Análise regional", icon: "map", path: "/admin/regional" },
    { title: "Ocorrências", icon: "alert", path: "/admin/ocorrencias" },
    { title: "Relatórios", icon: "chart", path: "/admin/relatorios" },
    { title: "Agenda geral", icon: "calendar", path: "/admin/agenda" },
    { title: "Alunos", icon: "users", path: "/admin/alunos" },
    { title: "Professores", icon: "user", path: "/admin/professores" },
    { title: "Solicitações", icon: "inbox", path: "/admin/solicitacoes" },
    { title: "Dados e importação", icon: "database", path: "/admin/dados" },
  ],
}

/** Titles for pages reachable by link but intentionally kept out of the menu. */
export const pageTitles: Record<string, string> = {
  "/admin/uso-do-site": "Uso do site",
}

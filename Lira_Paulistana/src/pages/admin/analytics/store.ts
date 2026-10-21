import { useSyncExternalStore } from "react"
import { generateDemo } from "./demo"
import type { Dataset, Filters, FollowUp, Settings } from "./types"
import type { ImportReport } from "./csv"

export const DEFAULT_FILTERS: Filters = {
  period: "90d",
  from: "",
  to: "",
  regiao: "",
  professor: "",
  modalidade: "",
  situacao: "todos",
  ingresso: "todas",
}
export const DEFAULT_SETTINGS: Settings = {
  metaRetencao: 85,
  metaPresenca: 80,
  limiteCancelamento: 8,
  metaSatisfacao: 4,
  metaResposta: 20,
  limiteAtencao: 75,
  limiteCritico: 55,
  minPrevistas: 4,
  faltasNaoJustificadas: 3,
  amostraMinima: 15,
  minRegiao: 5,
}

type State = {
  dataset: Dataset
  filters: Filters
  settings: Settings
  followups: Record<string, FollowUp>
  staged: ImportReport[]
}

const KEYS = {
  filters: "lira-admin-filters",
  settings: "lira-admin-settings",
  followups: "lira-admin-followups",
  imported: "lira-admin-imported",
}
function read<T>(store: Storage, key: string, fallback: T): T {
  try {
    const v = store.getItem(key)
    return v ? { ...fallback, ...JSON.parse(v) as T } : fallback
  } catch {
    return fallback
  }
}
function write(store: Storage, key: string, value: unknown) {
  try {
    if (value === null) store.removeItem(key)
    else store.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked: keep in memory only */
  }
}

let demoCache: Dataset | null = null
const demo = () => (demoCache ??= generateDemo())

function initial(): State {
  const imported = read<Dataset | null>(sessionStorage, KEYS.imported, null)
  return {
    dataset: imported && imported.origin === "importado" ? imported : demo(),
    filters: read(sessionStorage, KEYS.filters, DEFAULT_FILTERS),
    settings: read(localStorage, KEYS.settings, DEFAULT_SETTINGS),
    followups: read<Record<string, FollowUp>>(localStorage, KEYS.followups, {}),
    staged: [],
  }
}

let state: State | null = null
const listeners = new Set<() => void>()
const get = () => (state ??= initial())
function set(patch: Partial<State>) {
  state = { ...get(), ...patch }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useAnalytics() {
  return useSyncExternalStore(subscribe, get)
}

export const actions = {
  setFilters(patch: Partial<Filters>) {
    const filters = { ...get().filters, ...patch }
    write(sessionStorage, KEYS.filters, filters)
    set({ filters })
  },
  resetFilters() {
    write(sessionStorage, KEYS.filters, DEFAULT_FILTERS)
    set({ filters: DEFAULT_FILTERS })
  },
  setSettings(patch: Partial<Settings>) {
    const settings = { ...get().settings, ...patch }
    write(localStorage, KEYS.settings, settings)
    set({ settings })
  },
  resetSettings() {
    write(localStorage, KEYS.settings, null)
    set({ settings: DEFAULT_SETTINGS })
  },
  setFollowup(id: string, patch: Partial<FollowUp>) {
    const prev = get().followups[id] || {
      estado: "pendente",
      responsavel: "",
      ultimoContato: "",
    }
    const followups = { ...get().followups, [id]: { ...prev, ...patch } }
    write(localStorage, KEYS.followups, followups)
    set({ followups })
  },
  setStaged(staged: ImportReport[]) {
    set({ staged })
  },
  loadImported(dataset: Dataset) {
    write(sessionStorage, KEYS.imported, dataset)
    set({
      dataset,
      filters: { ...get().filters, regiao: "", professor: "", modalidade: "" },
    })
  },
  loadDemo() {
    write(sessionStorage, KEYS.imported, null)
    set({
      dataset: demo(),
      filters: { ...get().filters, regiao: "", professor: "", modalidade: "" },
    })
  },
}

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui'
import * as P from './pages'
import type { Page } from './pages'

type Prefs = { size: number; contrast: boolean; spacing: boolean; motion: boolean; focus: boolean }
const DEFAULT: Prefs = { size: 16, contrast: false, spacing: false, motion: true, focus: true }

type Role = 'Administrador' | 'Professor' | 'Aluno / responsável'
const NAV: Record<Role, [string, Page][]> = {
  Administrador: [['Início', 'admin'], ['Agenda', 'agenda'], ['Agendar aula', 'agendar'], ['Verificações', 'verificacoes'], ['Cadastro de alunos', 'cadastro-aluno']],
  Professor: [['Portal do professor', 'portal-professor'], ['Minha agenda', 'agenda'], ['Planejar aulas', 'planejar'], ['Conteúdos', 'conteudos']],
  'Aluno / responsável': [['Portal do aluno', 'portal-aluno'], ['Cadastro', 'cadastro-aluno'], ['Minhas aulas', 'agenda'], ['Buscar professores', 'professores']],
}
const ROLE_OF: Partial<Record<Page, Role>> = {
  admin: 'Administrador', verificacoes: 'Administrador', agendar: 'Administrador',
  'portal-professor': 'Professor', planejar: 'Professor', conteudos: 'Professor',
  'portal-aluno': 'Aluno / responsável', 'cadastro-aluno': 'Aluno / responsável',
}
const PUBLIC: Page[] = ['home', 'login', 'professores']

function Logo({ go }: { go: (p: Page) => void }) {
  return (
    <button onClick={() => go('home')} className="flex items-center gap-2.5 text-left">
      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-brand font-display text-lg text-white">L</span>
      <span className="font-display text-lg font-semibold leading-none">Lira Paulistana</span>
    </button>
  )
}

function A11yDialog({ prefs, onApply, onClose }: { prefs: Prefs; onApply: (p: Prefs) => void; onClose: () => void }) {
  const [d, setD] = useState(prefs)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const toggle = (key: keyof Prefs, label: string) => (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-sand px-4 py-3">
      <span>{label}</span>
      <input type="checkbox" checked={d[key] as boolean} onChange={(e) => setD({ ...d, [key]: e.target.checked })} className="h-5 w-5 accent-[var(--color-brand)]" />
    </label>
  )
  const seg = (key: 'contrast' | 'spacing', labels: [string, string]) => (
    <div className="grid grid-cols-2 gap-2">
      {labels.map((l, i) => (
        <button key={l} aria-pressed={d[key] === !!i} onClick={() => setD({ ...d, [key]: !!i })} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${d[key] === !!i ? 'border-brand bg-brand text-white' : 'border-line bg-white'}`}>{l}</button>
      ))}
    </div>
  )
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 p-4 md:p-10" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="a11y-t" onClick={(e) => e.stopPropagation()} className="mx-auto grid max-w-5xl gap-8 rounded-3xl bg-paper p-6 md:grid-cols-2 md:p-10">
        <div className="order-2 md:order-1">
          <h2 className="font-display text-3xl font-semibold">Sua experiência de leitura</h2>
          <p className="mt-3 text-muted">Ajuste a apresentação conforme sua preferência. O conteúdo e a navegação devem continuar disponíveis sem depender destas opções.</p>
          <div className="mt-8 rounded-2xl border border-line bg-sand p-6" style={{ fontSize: d.size, lineHeight: d.spacing ? 1.9 : 1.5 }}>
            <p className="font-display text-xl font-semibold">Prévia de leitura</p>
            <p className="mt-3">Sua próxima aula é na sexta-feira. Acesse os materiais antes do encontro e estude no seu ritmo.</p>
            <span className="mt-5 block rounded-lg border border-ink bg-white px-4 py-2.5 text-center text-sm font-semibold" style={d.focus ? { outline: '4px solid #b5562f', outlineOffset: 3 } : {}}>Exemplo de botão em foco</span>
          </div>
          <p className="mt-6 text-sm text-muted">Uso por teclado: Tab percorre os controles; Enter ativa; Esc fecha o painel e devolve o foco ao botão de abertura.</p>
        </div>
        <div className="order-1 space-y-5 rounded-2xl border border-line bg-white p-6 md:order-2">
          <div className="flex items-start justify-between">
            <div><h2 id="a11y-t" className="font-display text-2xl font-semibold">Acessibilidade</h2><p className="text-muted">Preferências de apresentação</p></div>
            <Button aria-label="Fechar" onClick={onClose}>×</Button>
          </div>
          <div><p className="mb-1.5 text-sm font-semibold">Tamanho do texto</p>
            <div className="flex items-center gap-2">
              <Button aria-label="Diminuir texto" onClick={() => setD({ ...d, size: Math.max(14, d.size - 2) })}>A−</Button>
              <span className="flex-1 text-center text-sm" aria-live="polite">{d.size === 16 ? 'Padrão' : `${Math.round((d.size / 16) * 100)}%`}</span>
              <Button aria-label="Aumentar texto" onClick={() => setD({ ...d, size: Math.min(24, d.size + 2) })}>A+</Button>
            </div></div>
          <div><p className="mb-1.5 text-sm font-semibold">Contraste</p>{seg('contrast', ['Padrão', 'Alto contraste'])}</div>
          <div><p className="mb-1.5 text-sm font-semibold">Espaçamento do texto</p>{seg('spacing', ['Padrão', 'Ampliado'])}</div>
          {toggle('motion', 'Reduzir movimento')}
          {toggle('focus', 'Destacar o foco do teclado')}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button onClick={() => setD(DEFAULT)}>Restaurar padrão</Button>
            <Button variant="primary" onClick={() => { onApply(d); onClose() }}>Aplicar preferências</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [role, setRole] = useState<Role>('Administrador')
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT)
  const [a11y, setA11y] = useState(false)
  const opener = useRef<HTMLElement | null>(null)

  const go = (p: Page) => { if (ROLE_OF[p]) setRole(ROLE_OF[p]!); setPage(p); window.scrollTo(0, 0) }
  const openA11y = (e: React.MouseEvent<HTMLElement>) => { opener.current = e.currentTarget; setA11y(true) }
  const closeA11y = () => { setA11y(false); setTimeout(() => opener.current?.focus(), 0) }

  useEffect(() => {
    const h = document.documentElement
    h.style.setProperty('--base-size', `${prefs.size}px`)
    h.classList.toggle('a11y-contrast', prefs.contrast)
    h.classList.toggle('a11y-spacing', prefs.spacing)
    h.classList.toggle('a11y-motion', prefs.motion)
    h.classList.toggle('a11y-focus', prefs.focus)
  }, [prefs])

  const isPublic = PUBLIC.includes(page)
  const render = () => {
    switch (page) {
      case 'home': return <P.Home go={go} />
      case 'login': return <P.Login go={go} />
      case 'professores': return <P.Professores go={go} />
      case 'admin': return <P.Admin go={go} />
      case 'agenda': return <P.Agenda go={go} />
      case 'agendar': return <P.Agendar go={go} />
      case 'verificacoes': return <P.Verificacoes />
      case 'planejar': return <P.Planejar />
      case 'conteudos': return <P.Conteudos />
      case 'portal-professor': return <P.PortalProfessor go={go} />
      case 'cadastro-aluno': return <P.CadastroAluno go={go} />
      case 'portal-aluno': return <P.PortalAluno go={go} />
    }
  }

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Pular para o conteúdo principal</a>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4 px-6 py-3">
          <Logo go={go} />
          {!isPublic && <span className="hidden text-sm text-muted md:inline">Ambiente de aprendizagem</span>}
          <nav aria-label="Principal" className="ml-auto flex flex-wrap items-center gap-1">
            {isPublic ? (
              <>
                {['A escola', 'Cursos', 'Contato'].map((l) => <Button key={l} variant="ghost" onClick={() => go('home')}>{l}</Button>)}
                <Button variant="ghost" aria-current={page === 'professores' ? 'page' : undefined} onClick={() => go('professores')}>Professores</Button>
                <Button variant="ghost" onClick={openA11y}>Acessibilidade</Button>
                <Button variant="primary" className="ml-2" onClick={() => go('login')}>Entrar</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={openA11y}>Acessibilidade</Button>
                <Button variant="ghost">Avisos <span className="rounded-full bg-accent px-1.5 text-xs text-white">2</span><span className="sr-only">não lidos</span></Button>
                <Button>Minha conta</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {isPublic ? (
        <main id="main">{render()}</main>
      ) : (
        <div className="flex">
          <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-60 shrink-0 flex-col border-r border-line bg-sand p-4 md:flex">
            <label className="mb-4 block text-xs font-semibold uppercase tracking-widest text-muted">
              Perfil
              <select value={role} onChange={(e) => { const r = e.target.value as Role; setRole(r); go(NAV[r][0][1]) }} className="mt-1.5 w-full rounded-lg border border-line bg-white px-2 py-2 text-sm normal-case tracking-normal text-ink">
                {Object.keys(NAV).map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <nav aria-label="Seções" className="space-y-1">
              {NAV[role].map(([l, p]) => (
                <button key={l} onClick={() => setPage(p)} aria-current={page === p ? 'page' : undefined}
                  className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm ${page === p ? 'bg-white font-semibold text-brand shadow-sm' : 'hover:bg-white/60'}`}>{l}</button>
              ))}
            </nav>
            <div className="mt-auto space-y-2">
              <Button className="w-full" onClick={openA11y}>Acessibilidade</Button>
              <Button className="w-full" onClick={() => go('home')}>Sair</Button>
            </div>
          </aside>
          <main id="main" className="min-w-0 flex-1 px-6 py-10 md:px-10"><div className="mx-auto max-w-6xl">{render()}</div></main>
        </div>
      )}
      {a11y && <A11yDialog prefs={prefs} onApply={setPrefs} onClose={closeA11y} />}
    </div>
  )
}

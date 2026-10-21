import { useEffect, useState, type ReactNode } from "react"
import AccessibilityDialog from "./components/AccessibilityDialog"
import { Icon, Logo, NavAnchor, PrimaryButton } from "./components/UI"
import {
  accounts,
  initialData,
  nav,
  pageTitles,
  roleInfo,
  type Account,
  type DemoData,
  type Go,
  type Role,
} from "./data/mock"
import {
  Contato,
  Escola,
  Experiencias,
  Home,
  Login,
  Professores,
} from "./pages/public/PublicPages"
import AlunoPages from "./pages/aluno/AlunoPages"
import ProfessorPages from "./pages/professor/ProfessorPages"
import AdminPages from "./pages/admin/AdminPages"
import CadastroAluno from "./cadastro"
import Questionario from "./questionario"
import { usePreferences } from "./preferences"

function readSession(): Account | null {
  try {
    const v = sessionStorage.getItem("lira-demo-session")
    const s = v ? JSON.parse(v) as Account : null
    return (
      accounts.find((a) => a.email === s?.email && a.role === s.role) || null
    )
  } catch {
    return null
  }
}
function readData(): DemoData {
  try {
    const v = localStorage.getItem("lira-demo-data")
    return v ? { ...initialData, ...JSON.parse(v) as DemoData } : initialData
  } catch {
    return initialData
  }
}
function initialPath() {
  return window.location.pathname.replace(/\/$/, "") || "/"
}
const publicNav = [
  ["Início", "/"],
  ["Experiências", "/experiencias"],
  ["Sobre a Lira", "/escola"],
  ["Professores", "/professores"],
  ["Contato", "/contato"],
]
const rolePaths: Role[] = ["aluno", "professor", "admin"]
function pathRole(path: string): Role | null {
  const r = path.split("/")[1] as Role
  return rolePaths.includes(r) ? r : null
}
function resolvePage(path: string): string {
  return [
    "/",
    "/experiencias",
    "/escola",
    "/professores",
    "/contato",
    "/entrar",
    "/cadastro",
    "/perfil-musical",
  ].includes(path) || pathRole(path)
    ? path
    : "/"
}

export default function App() {
  const [path, setPath] = useState(initialPath)
  const [session, setSession] = useState<Account | null>(readSession)
  const [data, setData] = useState<DemoData>(readData)
  const [mobileOpen, setMobileOpen] = useState(false)
  const {
    preferences,
    resolved,
    system,
    update: updatePreferences,
    reset: resetPreferences,
  } = usePreferences()
  const [accessOpen, setAccessOpen] = useState(false)
  const update = (fn: (d: DemoData) => DemoData) => setData(fn)
  useEffect(() => {
    localStorage.setItem("lira-demo-data", JSON.stringify(data))
  }, [data])
  useEffect(() => {
    const pop = () => {
      setPath(initialPath())
      setMobileOpen(false)
    }
    window.addEventListener("popstate", pop)
    return () => window.removeEventListener("popstate", pop)
  }, [])
  const go: Go = (target) => {
    const requested = resolvePage(target)
    const required = pathRole(requested)
    const next = required && required !== session?.role ? "/entrar" : requested
    window.history.pushState({}, "", next)
    setPath(next)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: "auto" })
  }
  const logIn = (account: Account) => {
    sessionStorage.setItem(
      "lira-demo-session",
      JSON.stringify({ role: account.role, email: account.email }),
    )
    setSession(account)
    const dest = roleInfo[account.role].initial
    window.history.replaceState({}, "", dest)
    setPath(dest)
    window.scrollTo(0, 0)
  }
  const logOut = () => {
    sessionStorage.removeItem("lira-demo-session")
    setSession(null)
    go("/")
  }
  const legacyGo = (page: string) => {
    const redirects: Record<string, string> = {
      questionario: "/perfil-musical",
      "cadastro-aluno": "/cadastro",
      professores: "/professores",
      agendar: "/entrar",
      "portal-aluno": "/entrar",
      home: "/",
    }
    go(redirects[page] || "/")
  }
  const role = pathRole(path)
  const blocked = !!role && session?.role !== role
  const screen = blocked ? "/entrar" : path
  const getPage = (): ReactNode => {
    if (screen === "/") return <Home go={go} />
    if (screen === "/experiencias") return <Experiencias go={go} />
    if (screen === "/escola") return <Escola go={go} />
    if (screen === "/professores") return <Professores go={go} />
    if (screen === "/contato") return <Contato />
    if (screen === "/entrar") return <Login go={go} onLogin={logIn} />
    if (screen === "/cadastro")
      return (
        <div className="legacy-page section-container public-page">
          <CadastroAluno go={legacyGo} />
        </div>
      )
    if (screen === "/perfil-musical")
      return (
        <div className="legacy-page section-container public-page">
          <Questionario go={legacyGo} />
        </div>
      )
    if (role === "aluno")
      return (
        <AlunoPages
          key={screen}
          section={screen.split("/")[2] || "home"}
          go={go}
          data={data}
          update={update}
        />
      )
    if (role === "professor")
      return (
        <ProfessorPages
          key={screen}
          section={screen.split("/")[2] || "home"}
          go={go}
          data={data}
          update={update}
        />
      )
    if (role === "admin")
      return (
        <AdminPages
          key={screen}
          section={screen.split("/")[2] || "home"}
          go={go}
          data={data}
          update={update}
        />
      )
    return <Home go={go} />
  }
  const isPortal = !!role && !blocked
  const currentNav = role ? nav[role] : []
  const sectionTitle =
    currentNav.find((item) => item.path === path)?.title ||
    pageTitles[path] ||
    "Visão geral"
  return (
    <div
      className={`app-root ${
        isPortal ? `is-portal role-${role}` : "is-public"
      }`}
    >
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      {isPortal && role && session ? (
        <>
          <aside
            className={`portal-sidebar ${
              mobileOpen ? "portal-sidebar--open" : ""
            }`}
            aria-label="Navegação do perfil"
          >
            <div className="sidebar-header">
              <Logo go={go} inverted />
              <button
                className="sidebar-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <Icon name="x" />
              </button>
            </div>
            <div className="sidebar-label">
              {roleInfo[role].area.toUpperCase()}
            </div>
            <nav className="sidebar-nav" aria-label="Seções da sua área">
              {currentNav.map((item) => (
                <NavAnchor
                  key={item.path}
                  to={item.path}
                  go={go}
                  active={path === item.path}
                  className={`sidebar-link ${
                    path === item.path ? "sidebar-link--active" : ""
                  }`}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.title}</span>
                  {path === item.path && (
                    <span className="sidebar-active-dot" />
                  )}
                </NavAnchor>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-profile">
                <div className="sidebar-avatar">
                  {session.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <strong>{session.name}</strong>
                  <span>{roleInfo[role].label}</span>
                </div>
              </div>
              <button className="sidebar-signout" onClick={logOut}>
                <Icon name="logout" size={18} /> Sair da conta
              </button>
            </div>
          </aside>
          {mobileOpen && (
            <button
              aria-label="Fechar menu lateral"
              className="sidebar-backdrop"
              onClick={() => setMobileOpen(false)}
            />
          )}
          <div className="portal-main">
            <header className="portal-topbar">
              <div className="portal-topbar-left">
                <button
                  className="mobile-menu-button"
                  aria-label="Abrir menu"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen(true)}
                >
                  <Icon name="menu" />
                </button>
                <span className="topbar-breadcrumb">
                  {roleInfo[role].area} <Icon name="chevron" size={14} />
                  <strong>{sectionTitle}</strong>
                </span>
              </div>
              <div className="portal-topbar-right">
                <span className="demo-chip">AMBIENTE DEMONSTRATIVO</span>
                <button
                  className="topbar-a11y"
                  aria-haspopup="dialog"
                  onClick={() => setAccessOpen(true)}
                >
                  Acessibilidade
                </button>
                <button
                  className="topbar-user"
                  onClick={logOut}
                  title="Sair da demonstração"
                  aria-label={`Sair da conta de ${session.name}`}
                >
                  <span>{session.name.slice(0, 1)}</span>
                  <Icon name="logout" size={16} />
                </button>
              </div>
            </header>
            <main id="main" className="portal-page" key={screen}>
              {getPage()}
            </main>
            <footer className="portal-footer">
              <span>© Lira Paulistana · Protótipo navegável</span>
              <button
                aria-haspopup="dialog"
                onClick={() => setAccessOpen(true)}
              >
                Preferências de acessibilidade
              </button>
            </footer>
          </div>
        </>
      ) : (
        <>
          <header className="site-header">
            <div className="header-inner">
              <Logo go={go} />
              <nav
                className={`public-nav ${mobileOpen ? "public-nav--open" : ""}`}
                aria-label="Navegação principal"
              >
                {publicNav.map(([label, to]) => (
                  <NavAnchor
                    key={to}
                    to={to}
                    go={go}
                    active={screen === to}
                    className="public-nav-link"
                  >
                    {label}
                  </NavAnchor>
                ))}
                <button
                  aria-haspopup="dialog"
                  onClick={() => {
                    setMobileOpen(false)
                    setAccessOpen(true)
                  }}
                  className="mobile-access"
                >
                  Acessibilidade
                </button>
              </nav>
              <div className="header-right">
                <button
                  onClick={() => setAccessOpen(true)}
                  className="header-a11y"
                  aria-haspopup="dialog"
                  aria-label="Acessibilidade e aparência"
                  title="Acessibilidade e aparência"
                >
                  Aa
                </button>
                <PrimaryButton
                  onClick={() =>
                    go(session ? roleInfo[session.role].initial : "/entrar")
                  }
                >
                  {" "}
                  {session ? "Meu espaço" : "Entrar"}{" "}
                  <Icon name="arrow" size={17} />
                </PrimaryButton>
                <button
                  className="mobile-menu-button"
                  aria-label={
                    mobileOpen ? "Fechar navegação" : "Abrir navegação"
                  }
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  <Icon name={mobileOpen ? "x" : "menu"} />
                </button>
              </div>
            </div>
          </header>
          <main id="main">{getPage()}</main>
          {screen !== "/entrar" && (
            <footer className="site-footer">
              <div className="footer-grid">
                <div>
                  <Logo go={go} />
                  <p>
                    Mais do que aprender música.
                    <br />
                    Viver experiências que transformam.
                  </p>
                </div>
                <div>
                  <strong>Explore</strong>
                  {publicNav.slice(1).map(([label, to]) => (
                    <NavAnchor key={to} to={to} go={go}>
                      {label}
                    </NavAnchor>
                  ))}
                </div>
                <div>
                  <strong>Sua jornada</strong>
                  <NavAnchor to="/cadastro" go={go}>
                    Começar agora
                  </NavAnchor>
                  <NavAnchor to="/perfil-musical" go={go}>
                    Meu perfil musical
                  </NavAnchor>
                  <NavAnchor to="/entrar" go={go}>
                    Acessar minha conta
                  </NavAnchor>
                </div>
                <div>
                  <strong>Um espaço para todos</strong>
                  <p>Seu ritmo, seu jeito, sua música.</p>
                  <button
                    aria-haspopup="dialog"
                    onClick={() => setAccessOpen(true)}
                  >
                    Acessibilidade
                  </button>
                </div>
              </div>
              <div className="footer-bottom">
                © 2026 Lira Paulistana · Espaço Cultural · Protótipo de
                demonstração <span>Feito para sentir, criar e conectar.</span>
              </div>
            </footer>
          )}
        </>
      )}
      <AccessibilityDialog
        open={accessOpen}
        onClose={() => setAccessOpen(false)}
        preferences={preferences}
        resolved={resolved}
        system={system}
        onChange={updatePreferences}
        onReset={resetPreferences}
      />
    </div>
  )
}

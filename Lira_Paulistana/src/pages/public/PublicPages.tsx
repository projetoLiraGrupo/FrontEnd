import { useState, type FormEvent } from "react"
import FluidBackground from "../../components/FluidBackground"
import {
  Icon,
  NavAnchor,
  Panel,
  Pill,
  PrimaryButton,
  PageIntro,
} from "../../components/UI"
import {
  accounts,
  experiences,
  teachers,
  roleInfo,
  type Account,
  type Go,
  type Role,
} from "../../data/mock"

export function Home({ go }: { go: Go }) {
  return (
    <>
      <section className="hero-outer">
        <div className="hero-inner">
          <FluidBackground />
          <div className="hero-shade" />
          <div className="hero-body">
            <span className="hero-kicker">
              <span className="live-dot" /> ESPAÇO CULTURAL · EXPERIÊNCIAS
              MUSICAIS
            </span>
            <h1>
              Mais do que aprender.
              <br />
              <em>Viver a música.</em>
            </h1>
            <p>
              A música não cabe em uma fórmula. Na Lira Paulistana, cada
              encontro é uma experiência feita de descobertas, conexões e
              possibilidades.
            </p>
            <div className="hero-actions">
              <PrimaryButton onClick={() => go("/experiencias")}>
                Encontre sua experiência <Icon name="arrow" size={19} />
              </PrimaryButton>
              <NavAnchor to="/escola" go={go} className="hero-secondary">
                Conheça a Lira <Icon name="arrow" size={17} />
              </NavAnchor>
            </div>
            <div className="hero-bottom">
              <span>
                <Icon name="sparkles" size={17} /> Sua história também tem som.
              </span>
              <span>
                DESCUBRA O SEU RITMO <span className="tiny-line" />
              </span>
            </div>
          </div>
          <div className="hero-sticker" aria-hidden="true">
            <span className="sticker-wave">∿ ∿ ∿ ∿</span>
            <small>CRIAR · SENTIR · CONECTAR</small>
          </div>
        </div>
      </section>
      <section className="section-container welcome-section">
        <div className="section-top">
          <p className="eyebrow">NOSSO JEITO DE SER</p>
          <span>01 / Um espaço que escuta</span>
        </div>
        <div className="welcome-grid">
          <h2>
            Seu ritmo é o<br />
            <em>nosso ponto de partida.</em>
          </h2>
          <div>
            <p>
              Nem todo mundo sente, se expressa ou descobre da mesma forma. Por
              aqui, acolhemos o jeito singular de cada pessoa e transformamos o
              encontro com a música em uma experiência que faz sentido.
            </p>
            <NavAnchor to="/escola" go={go} className="text-link">
              Descubra nossa essência <Icon name="arrow" size={18} />
            </NavAnchor>
          </div>
        </div>
      </section>
      <section className="section-container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">POSSIBILIDADES</p>
            <h2>
              Existe uma experiência
              <br />
              esperando por você.
            </h2>
          </div>
          <NavAnchor to="/experiencias" go={go} className="outline-link">
            Ver todas as experiências <Icon name="arrow" size={17} />
          </NavAnchor>
        </div>
        <div className="experience-grid">
          {experiences.slice(0, 3).map((e, i) => (
            <ExperienceCard
              key={e.id}
              exp={e}
              index={i}
              onClick={() => go("/experiencias")}
            />
          ))}
        </div>
      </section>
      <section className="section-container feature-feature">
        <div className="feature-visual">
          <span className="feature-orbit feature-orbit--one" />
          <span className="feature-orbit feature-orbit--two" />
          <span className="feature-orbit feature-orbit--three" />
          <div className="feature-note">
            <Icon name="music" size={42} />
          </div>
        </div>
        <div className="feature-text">
          <p className="eyebrow">CADA PESSOA, UMA MELODIA</p>
          <h2>
            Um espaço onde você pode ser <em>você.</em>
          </h2>
          <p>
            Acreditamos no potencial de cada trajetória. Nossa proposta valoriza
            a escuta, a autonomia, a inclusão e a liberdade de explorar — sem
            comparações, sem pressa.
          </p>
          <PrimaryButton onClick={() => go("/perfil-musical")}>
            Descubra seu perfil musical <Icon name="arrow" size={18} />
          </PrimaryButton>
        </div>
      </section>
      <section className="section-container cta-bottom">
        <p>COMECE UMA NOVA HISTÓRIA</p>
        <h2>
          Qual som a sua história
          <br />
          pode criar?
        </h2>
        <PrimaryButton light onClick={() => go("/cadastro")}>
          Começar minha jornada <Icon name="arrow" size={18} />
        </PrimaryButton>
        <span className="cta-art" aria-hidden="true">
          ♫
        </span>
      </section>
    </>
  )
}

type Exp = typeof experiences[number]
export function ExperienceCard({
  exp,
  index,
  onClick,
  action = "Explorar experiência",
}: {
  exp: Exp
  index: number
  onClick: () => void
  action?: string
}) {
  return (
    <article className="experience-card">
      <div className={`experience-art experience-art--${exp.tone}`}>
        <div className="mini-fluid" />
        <span className="experience-number">0{index + 1} / 04</span>
        <div className="exp-icon">
          <Icon name={exp.icon} size={36} />
        </div>
        <div className="experience-art-line">♪ 〜 ♫ 〜 ♪</div>
      </div>
      <div className="experience-content">
        <span className="experience-tag">
          {exp.kind} · {exp.duration}
        </span>
        <h3>{exp.name}</h3>
        <p>{exp.description}</p>
        <button className="card-link" onClick={onClick}>
          {action} <Icon name="arrow" size={17} />
        </button>
      </div>
    </article>
  )
}

export function Experiencias({ go }: { go: Go }) {
  const [filter, setFilter] = useState("Todas")
  const shown = experiences.filter(
    (e) => filter === "Todas" || e.kind === filter,
  )
  return (
    <div className="section-container public-page">
      <PageIntro
        eyebrow="EXPLORE O QUE TE MOVE"
        title="Experiências que ganham vida."
        desc="Não se trata apenas de tocar um instrumento. Trata-se de descobrir novas possibilidades de se expressar."
      />
      <div
        className="filter-bar"
        role="group"
        aria-label="Filtrar experiências"
      >
        {["Todas", "Instrumental", "Vocal", "Coletiva"].map((f) => (
          <button
            key={f}
            className={filter === f ? "filter active" : "filter"}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="experience-grid experience-grid--all">
        {shown.map((e, i) => (
          <ExperienceCard
            key={e.id}
            exp={e}
            index={i}
            onClick={() => go("/entrar")}
            action="Quero participar"
          />
        ))}
      </div>
      <div className="info-banner">
        <Icon name="heart" size={23} />
        <div>
          <h3>Não sabe por onde começar?</h3>
          <p>
            Seu perfil musical pode ajudar a encontrar experiências alinhadas ao
            seu jeito de aprender.
          </p>
        </div>
        <PrimaryButton onClick={() => go("/perfil-musical")}>
          Conhecer meu perfil <Icon name="arrow" size={17} />
        </PrimaryButton>
      </div>
    </div>
  )
}

export function Escola({ go }: { go: Go }) {
  return (
    <div className="section-container public-page">
      <PageIntro
        eyebrow="PRAZER, SOMOS A LIRA"
        title={
          <>
            Um espaço cultural feito de <em>encontros.</em>
          </>
        }
        desc="Uma proposta de educação musical que respeita diferentes formas de aprender, sentir e participar."
      />
      <div className="about-hero">
        <div>
          <span className="light-eyebrow">NOSSO PROPÓSITO</span>
          <h2>Música é muito mais do que técnica.</h2>
          <p>
            É descobrir, compartilhar, criar vínculos e ganhar confiança. Aqui,
            cada pessoa é protagonista da própria experiência musical.
          </p>
        </div>
        <div className="about-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="values-grid">
        {[
          [
            "Escuta",
            "Cada trajetória começa quando alguém se sente ouvido.",
            "headphones",
          ],
          [
            "Liberdade",
            "Há muitas maneiras de experimentar e se expressar.",
            "sparkles",
          ],
          [
            "Acolhimento",
            "Respeitamos diferentes ritmos, repertórios e necessidades.",
            "heart",
          ],
        ].map(([t, d, i]) => (
          <Panel key={t}>
            <span className="value-icon">
              <Icon name={i} size={24} />
            </span>
            <h3>{t}</h3>
            <p>{d}</p>
          </Panel>
        ))}
      </div>
      <div className="simple-cta">
        <h2>Venha fazer parte dessa história.</h2>
        <PrimaryButton onClick={() => go("/cadastro")}>
          Quero conhecer a Lira <Icon name="arrow" size={18} />
        </PrimaryButton>
      </div>
    </div>
  )
}

export function Professores({ go }: { go: Go }) {
  return (
    <div className="section-container public-page">
      <PageIntro
        eyebrow="QUEM CAMINHA COM VOCÊ"
        title="Pessoas que inspiram sons."
        desc="Educadores que acolhem diferentes percursos e constroem encontros musicais com você."
      />
      <div className="teacher-grid">
        {teachers.map((t, i) => (
          <article className="teacher-card" key={t.id}>
            <div
              className={`teacher-portrait teacher-portrait--${i}`}
              aria-hidden="true"
            >
              <div className="portrait-wave" />
              <span>{t.initials}</span>
            </div>
            <div className="teacher-content">
              <Pill>{t.tag}</Pill>
              <h2>{t.name}</h2>
              <p className="teacher-area">{t.area}</p>
              <p>{t.bio}</p>
              <button onClick={() => go("/entrar")} className="card-link">
                Conhecer experiências <Icon name="arrow" size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="info-banner">
        <Icon name="compass" />
        <div>
          <h3>A melhor conexão começa com a escuta.</h3>
          <p>
            Conheça seu perfil e descubra diferentes possibilidades de encontros
            musicais.
          </p>
        </div>
        <PrimaryButton onClick={() => go("/perfil-musical")}>
          Fazer questionário <Icon name="arrow" size={16} />
        </PrimaryButton>
      </div>
    </div>
  )
}

export function Contato() {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <div className="section-container public-page contact-page">
      <PageIntro
        eyebrow="VAMOS CONVERSAR"
        title="Toda boa música começa com um encontro."
        desc="Tem dúvidas sobre a Lira ou quer descobrir por onde começar? Fale com a gente."
      />
      <div className="contact-grid">
        <div className="contact-side">
          <Icon name="message" size={33} />
          <h2>Estamos aqui para ouvir.</h2>
          <p>
            Conte seus interesses, expectativas e como podemos construir uma boa
            experiência musical com você.
          </p>
          <div className="contact-detail">
            <span>E-MAIL DA LIRA</span>
            <strong>
              Contato disponível mediante confirmação com a instituição
            </strong>
          </div>
          <small>
            Esta é uma interface demonstrativa. Nenhuma mensagem será enviada.
          </small>
        </div>
        <Panel>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Seu nome
              <input required placeholder="Como podemos chamar você?" />
            </label>
            <label>
              Seu e-mail
              <input type="email" required placeholder="voce@exemplo.com" />
            </label>
            <label>
              Assunto
              <select>
                <option>Quero conhecer as experiências</option>
                <option>Tenho uma dúvida</option>
                <option>Quero ser professor</option>
              </select>
            </label>
            <label>
              Sua mensagem
              <textarea
                rows={5}
                required
                placeholder="Escreva sua mensagem..."
              />
            </label>
            <PrimaryButton type="submit">
              Enviar mensagem <Icon name="arrow" size={17} />
            </PrimaryButton>
            {sent && (
              <p className="form-feedback" role="status">
                Mensagem registrada nesta demonstração. Obrigado pelo interesse!
              </p>
            )}
          </form>
        </Panel>
      </div>
    </div>
  )
}

export function Login({
  go,
  onLogin,
}: {
  go: Go
  onLogin: (account: Account) => void
}) {
  const [role, setRole] = useState<Role>("aluno")
  const [email, setEmail] = useState(accounts[0].email)
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const pick = (r: Role) => {
    setRole(r)
    setEmail(accounts.find((a) => a.role === r)!.email)
    setPassword("")
    setError("")
  }
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const matched = accounts.find(
      (a) =>
        a.role === role &&
        a.email.toLowerCase() === email.trim().toLowerCase() &&
        a.password === password,
    )
    if (matched) onLogin(matched)
    else
      setError(
        "Credenciais de demonstração incorretas. Use a conta exibida abaixo.",
      )
  }
  return (
    <div className="login-layout">
      <div className="login-art">
        <FluidBackground />
        <div className="login-art-copy">
          <p className="light-eyebrow">SUA EXPERIÊNCIA CONTINUA AQUI</p>
          <h1>
            O seu espaço.
            <br />
            <em>O seu ritmo.</em>
          </h1>
          <p>
            Um lugar para organizar encontros, descobrir possibilidades e viver
            a música todos os dias.
          </p>
          <div className="login-art-note">
            <Icon name="music" size={20} /> A música nos conecta.
          </div>
        </div>
      </div>
      <div className="login-side">
        <div className="login-inner">
          <p className="eyebrow">BEM-VINDO DE VOLTA</p>
          <h1>Entre no seu espaço.</h1>
          <p className="login-subtitle">Selecione seu perfil para continuar.</p>
          <div className="role-picker" role="group" aria-label="Tipo de acesso">
            {(["aluno", "professor", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => pick(r)}
                aria-pressed={role === r}
                className={`role-choice ${
                  r === role ? "role-choice--selected" : ""
                }`}
              >
                <Icon
                  name={
                    r === "admin"
                      ? "chart"
                      : r === "professor"
                        ? "music"
                        : "user"
                  }
                  size={20}
                />
                <span>{roleInfo[r].label}</span>
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="form-stack login-form">
            <label>
              E-mail
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Senha
              <div className="password-field">
                <input
                  required
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShow((v) => !v)}
                >
                  <Icon name={show ? "eyeoff" : "eye"} size={19} />
                </button>
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <PrimaryButton type="submit" className="login-submit">
              Entrar como {roleInfo[role].label.toLowerCase()}{" "}
              <Icon name="arrow" size={18} />
            </PrimaryButton>
          </form>
          <div className="demo-credentials">
            <span className="demo-label">
              <Icon name="sparkles" size={15} /> ACESSO SIMULADO
            </span>
            <p>
              <strong>Conta:</strong>{" "}
              {accounts.find((a) => a.role === role)?.email}
            </p>
            <p>
              <strong>Senha:</strong> demo123
            </p>
            <button
              onClick={() => onLogin(accounts.find((a) => a.role === role)!)}
            >
              Acessar demonstração sem digitar <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="login-footer">
            <p>
              Primeira vez por aqui?{" "}
              <NavAnchor to="/cadastro" go={go}>
                Comece sua jornada
              </NavAnchor>
            </p>
            <NavAnchor to="/" go={go} className="back-link">
              <Icon name="arrowleft" size={17} /> Voltar ao site
            </NavAnchor>
          </div>
        </div>
      </div>
    </div>
  )
}

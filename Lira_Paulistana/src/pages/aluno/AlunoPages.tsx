import { useState } from "react"
import FluidBackground from "../../components/FluidBackground"
import {
  AgendaRow,
  Messages,
  type UpdateData,
} from "../../components/PortalBits"
import {
  Icon,
  PageIntro,
  Panel,
  Pill,
  PrimaryButton,
  Stat,
} from "../../components/UI"
import { experiences, type DemoData, type Go } from "../../data/mock"
import { ExperienceCard } from "../public/PublicPages"

type Props = {
  section: string
  go: Go
  data: DemoData
  update: UpdateData
}
export default function AlunoPages({ section, go, data, update }: Props) {
  const [toast, setToast] = useState("")
  const [stars, setStars] = useState(0)
  const [filter, setFilter] = useState("Todas")
  const enroll = (id: string) => {
    if (
      data.enrollments.some(
        (x) => x.experienceId === id && x.status !== "Recusada",
      )
    )
      return
    update((d) => ({
      ...d,
      enrollments: [
        ...d.enrollments,
        {
          id: Date.now(),
          experienceId: id,
          name: "Marina Alves",
          status: "Pendente",
        },
      ],
    }))
    setToast("Sua solicitação foi registrada e está aguardando a equipe.")
  }
  if (section === "home")
    return (
      <>
        <div className="portal-welcome">
          <FluidBackground />
          <div className="portal-welcome-overlay" />
          <div className="portal-welcome-content">
            <p className="light-eyebrow">MINHA JORNADA MUSICAL</p>
            <h1>
              Olá, Marina! <span>♪</span>
            </h1>
            <p>
              Que bom ter você por aqui. Vamos descobrir o que a música reserva
              para hoje?
            </p>
            <PrimaryButton light onClick={() => go("/aluno/experiencias")}>
              Explorar experiências <Icon name="arrow" size={17} />
            </PrimaryButton>
          </div>
          <div className="portal-welcome-mark" aria-hidden>
            ♫
          </div>
        </div>
        <div className="stat-grid">
          <Stat
            label="Experiências na minha jornada"
            value={String(
              data.enrollments.filter((x) => x.status === "Confirmada").length,
            ).padStart(2, "0")}
            icon="music"
            hint="Seu repertório está crescendo"
          />
          <Stat
            label="Próximo encontro"
            value="Sex, 23"
            icon="calendar"
            hint="10h · Piano & descoberta"
          />
          <Stat
            label="Novidades da comunidade"
            value={String(data.messages.length).padStart(2, "0")}
            icon="message"
            hint="Confira suas mensagens"
          />
        </div>
        <div className="portal-two-cols">
          <Panel>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">PRA FICAR NA AGENDA</p>
                <h2>Seu próximo encontro</h2>
              </div>
              <Pill tone="positive">Confirmado</Pill>
            </div>
            <div className="next-event">
              <div className="next-event-icon">
                <Icon name="piano" size={30} />
              </div>
              <div>
                <h3>Piano & descoberta</h3>
                <p>Com Rafael Costa</p>
                <span>
                  <Icon name="calendar" size={15} /> Sexta, 23 de outubro ·
                  10h00
                </span>
              </div>
            </div>
            <button className="card-link" onClick={() => go("/aluno/agenda")}>
              Ver minha agenda <Icon name="arrow" size={17} />
            </button>
          </Panel>
          <Panel className="mint-panel">
            <p className="eyebrow">SEU ESPAÇO DE DESCOBERTA</p>
            <h2>Todo mundo tem seu próprio ritmo.</h2>
            <p>
              Responda algumas perguntas e descubra como suas preferências podem
              contribuir para uma experiência mais especial.
            </p>
            <button className="card-link" onClick={() => go("/aluno/perfil")}>
              Meu perfil musical <Icon name="arrow" size={18} />
            </button>
            <span className="mint-panel-art" aria-hidden>
              ∿
            </span>
          </Panel>
        </div>
        <div className="portal-section-title">
          <div>
            <p className="eyebrow">CONTINUE EXPLORANDO</p>
            <h2>Encontre novos sons</h2>
          </div>
          <button
            className="card-link"
            onClick={() => go("/aluno/experiencias")}
          >
            Ver todas <Icon name="arrow" size={17} />
          </button>
        </div>
        <div className="experience-grid portal-experiences">
          {experiences.slice(1, 3).map((e, i) => (
            <ExperienceCard
              key={e.id}
              exp={e}
              index={i}
              onClick={() => go("/aluno/experiencias")}
            />
          ))}
        </div>
      </>
    )
  if (section === "experiencias")
    return (
      <>
        <PageIntro
          eyebrow="NOVAS POSSIBILIDADES"
          title="Encontre seu próximo som."
          desc="Escolha experiências no seu ritmo. As solicitações são simuladas nesta versão."
        />
        <div
          className="filter-bar"
          role="group"
          aria-label="Filtrar experiências"
        >
          {["Todas", "Instrumental", "Vocal", "Coletiva"].map((f) => (
            <button
              key={f}
              className={`filter ${filter === f ? "active" : ""}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="experience-grid experience-grid--all">
          {experiences
            .filter((e) => filter === "Todas" || e.kind === filter)
            .map((e, i) => (
              <ExperienceCard
                key={e.id}
                index={i}
                exp={e}
                onClick={() => enroll(e.id)}
                action={
                  data.enrollments.some(
                    (x) => x.experienceId === e.id && x.status !== "Recusada",
                  )
                    ? "Já está na sua jornada"
                    : "Solicitar participação"
                }
              />
            ))}
        </div>
        {toast && (
          <p className="inline-feedback" role="status">
            <Icon name="check" size={18} />
            {toast}
          </p>
        )}
      </>
    )
  if (section === "agenda")
    return (
      <>
        <PageIntro
          eyebrow="SEU TEMPO COM A MÚSICA"
          title="Minha agenda"
          desc="Seus encontros musicais e solicitações, em um só lugar."
          right={
            <PrimaryButton onClick={() => go("/aluno/experiencias")}>
              Nova experiência <Icon name="plus" size={17} />
            </PrimaryButton>
          }
        />
        <Panel>
          <div className="panel-heading">
            <h2>Encontros e solicitações</h2>
            <Pill>{data.enrollments.length} registros</Pill>
          </div>
          <div className="agenda-list">
            <AgendaRow
              name="Piano & descoberta"
              person="Rafael Costa · Sala Harmonia"
              date="SEX 23"
              time="10h00 – 10h50"
            />
            {data.enrollments
              .filter((x) => x.experienceId !== "piano")
              .map((item) => (
                <AgendaRow
                  key={item.id}
                  name={
                    experiences.find((e) => e.id === item.experienceId)?.name ||
                    "Experiência"
                  }
                  person="Aguardando definição de horário"
                  date="A DEF"
                  time="A confirmar"
                  status={item.status}
                />
              ))}
          </div>
        </Panel>
        <div className="info-banner">
          <Icon name="heart" />
          <div>
            <h3>Seu ritmo vem primeiro.</h3>
            <p>
              Quer ajustar uma experiência? Fale com a equipe pelo espaço de
              mensagens.
            </p>
          </div>
          <PrimaryButton onClick={() => go("/aluno/mensagens")}>
            Conversar com a equipe <Icon name="arrow" size={17} />
          </PrimaryButton>
        </div>
      </>
    )
  if (section === "jornada")
    return (
      <>
        <PageIntro
          eyebrow="SEU CAMINHO É ÚNICO"
          title="Minha jornada musical"
          desc="Cada descoberta importa. Aqui você acompanha seus encontros, materiais e pequenas conquistas."
        />
        <div className="portal-two-cols">
          <Panel>
            <h2>Minha linha do tempo</h2>
            <div className="timeline">
              <div className="timeline-item">
                <span className="timeline-dot" />
                <small>PRÓXIMO PASSO</small>
                <h3>Encontro de piano</h3>
                <p>Explore uma melodia que tenha significado para você.</p>
              </div>
              <div className="timeline-item">
                <span className="timeline-dot" />
                <small>NA SUA JORNADA</small>
                <h3>Descobrindo a pulsação</h3>
                <p>Você experimentou ritmos com diferentes sons.</p>
              </div>
              <div className="timeline-item">
                <span className="timeline-dot" />
                <small>O COMEÇO DE TUDO</small>
                <h3>Boas-vindas à Lira</h3>
                <p>Uma nova história musical começou!</p>
              </div>
            </div>
          </Panel>
          <Panel>
            <h2>Para explorar no seu tempo</h2>
            <p className="panel-sub">Materiais compartilhados pela equipe</p>
            <div className="resource-list">
              {data.materials.map((m) => (
                <div className="resource-row" key={m.id}>
                  <div className="resource-icon">
                    <Icon name="music" size={21} />
                  </div>
                  <div>
                    <strong>{m.title}</strong>
                    <span>{m.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="divider-line" />
            <h3>Como foi seu último encontro?</h3>
            <p className="panel-sub">
              Sua percepção ajuda a criar encontros ainda melhores.
            </p>
            <div
              className="rating-stars"
              role="group"
              aria-label="Avaliar experiência de 1 a 5 estrelas"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`${n} estrelas`}
                  aria-pressed={stars === n}
                  onClick={() => setStars(n)}
                  style={{ opacity: stars === 0 || n <= stars ? 1 : 0.4 }}
                >
                  ★
                </button>
              ))}
            </div>
            <PrimaryButton
              onClick={() => {
                update((d) => ({ ...d, feedback: `${stars} estrelas` }))
                setToast(
                  "Obrigado! Sua avaliação foi registrada na demonstração.",
                )
              }}
              disabled={!stars}
            >
              Salvar avaliação <Icon name="arrow" size={17} />
            </PrimaryButton>
            {toast && (
              <p role="status" className="form-feedback">
                {toast}
              </p>
            )}
          </Panel>
        </div>
      </>
    )
  if (section === "mensagens")
    return (
      <>
        <PageIntro
          eyebrow="A MÚSICA APROXIMA"
          title="Mensagens"
          desc="Compartilhe uma dúvida, uma conquista ou uma nova ideia."
        />
        <Messages data={data} update={update} sender="Marina" />
      </>
    )
  return (
    <>
      <PageIntro
        eyebrow="CONHEÇA SEU JEITO"
        title="Meu perfil musical"
        desc="Seu perfil não é uma etiqueta. É um caminho para conhecer preferências e criar encontros mais significativos."
      />
      <div className="portal-two-cols">
        <Panel className="profile-panel">
          <div className="profile-avatar">MA</div>
          <h2>Marina Alves</h2>
          <p>Exploradora musical · Piano</p>
          <div className="profile-details">
            <span>
              INTERESSE PRINCIPAL <strong>Piano</strong>
            </span>
            <span>
              MEU RITMO <strong>Descoberta e experimentação</strong>
            </span>
            <span>
              PERFIL <strong>Em construção</strong>
            </span>
          </div>
        </Panel>
        <Panel className="mint-panel">
          <p className="eyebrow">MAIS SOBRE VOCÊ</p>
          <h2>Descubra o que te inspira.</h2>
          <p>
            Nosso questionário de preferências mostra diferentes forças do seu
            perfil de aprendizagem — sem reduzir você a uma única categoria.
          </p>
          <PrimaryButton onClick={() => go("/perfil-musical")}>
            Responder questionário <Icon name="arrow" size={18} />
          </PrimaryButton>
        </Panel>
      </div>
    </>
  )
}

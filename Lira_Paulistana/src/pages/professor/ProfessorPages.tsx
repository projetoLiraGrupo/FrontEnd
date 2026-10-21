import { useState, type FormEvent } from "react"
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

type Props = {
  section: string
  go: Go
  data: DemoData
  update: UpdateData
}
export default function ProfessorPages({ section, go, data, update }: Props) {
  const [student, setStudent] = useState("Marina Alves")
  const [title, setTitle] = useState("")
  const [goal, setGoal] = useState("")
  const [material, setMaterial] = useState("")
  const [type, setType] = useState("Guia de prática")
  const [notice, setNotice] = useState("")
  if (section === "home")
    return (
      <>
        <div className="portal-welcome portal-welcome--professor">
          <FluidBackground />
          <div className="portal-welcome-overlay" />
          <div className="portal-welcome-content">
            <p className="light-eyebrow">ESPAÇO DO PROFESSOR</p>
            <h1>
              Bom encontro, Rafael! <span>♪</span>
            </h1>
            <p>
              Seu espaço para inspirar descobertas, acompanhar participantes e
              criar experiências com significado.
            </p>
            <PrimaryButton light onClick={() => go("/professor/criar")}>
              Planejar uma experiência <Icon name="arrow" size={17} />
            </PrimaryButton>
          </div>
        </div>
        <div className="stat-grid">
          <Stat
            label="Encontros da semana"
            value="08"
            icon="calendar"
            hint="2 próximos nesta semana"
          />
          <Stat
            label="Participantes"
            value="12"
            icon="users"
            hint="Seu grupo de experiências"
          />
          <Stat
            label="Planos criados"
            value={String(data.plans.length).padStart(2, "0")}
            icon="sparkles"
            hint="Seu repertório pedagógico"
          />
        </div>
        <div className="portal-two-cols">
          <Panel>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">A SEGUIR</p>
                <h2>Próximos encontros</h2>
              </div>
              <button
                className="card-link"
                onClick={() => go("/professor/agenda")}
              >
                Ver agenda <Icon name="arrow" size={17} />
              </button>
            </div>
            <AgendaRow
              name="Piano & descoberta"
              person="Marina Alves"
              date="SEX 23"
              time="10h00"
            />
            <AgendaRow
              name="Piano & descoberta"
              person="Lucas Ferreira"
              date="SEX 23"
              time="14h00"
            />
          </Panel>
          <Panel className="mint-panel">
            <p className="eyebrow">CRIAR, NÃO APENAS ENSINAR</p>
            <h2>Um encontro pode transformar uma história.</h2>
            <p>
              Planeje vivências que respeitam a singularidade e os interesses de
              cada participante.
            </p>
            <button
              className="card-link"
              onClick={() => go("/professor/criar")}
            >
              Criar experiência <Icon name="arrow" size={17} />
            </button>
          </Panel>
        </div>
        <div className="portal-section-title">
          <div>
            <p className="eyebrow">SEU REPERTÓRIO</p>
            <h2>Planos recentes</h2>
          </div>
          <button className="card-link" onClick={() => go("/professor/criar")}>
            Adicionar plano <Icon name="plus" size={17} />
          </button>
        </div>
        <div className="cards-two">
          {data.plans.slice(-2).map((p) => (
            <Panel key={p.id}>
              <Pill tone="positive">Planejado</Pill>
              <h3 className="mt-title">{p.title}</h3>
              <p className="panel-sub">
                {p.student} · {p.goal}
              </p>
            </Panel>
          ))}
        </div>
      </>
    )
  if (section === "agenda")
    return (
      <>
        <PageIntro
          eyebrow="ORGANIZE SEUS ENCONTROS"
          title="Minha agenda"
          desc="Uma visão simples dos horários e pessoas que você vai encontrar."
        />
        <Panel>
          <div className="panel-heading">
            <h2>Próximas experiências</h2>
            <Pill tone="positive">Semana atual</Pill>
          </div>
          <AgendaRow
            name="Piano & descoberta"
            person="Marina Alves · Sala Harmonia"
            date="SEX 23"
            time="10h00 – 10h50"
          />
          <AgendaRow
            name="Piano & descoberta"
            person="Lucas Ferreira · Sala Harmonia"
            date="SEX 23"
            time="14h00 – 14h50"
          />
          <AgendaRow
            name="Cordas que conectam"
            person="Turma Experiências"
            date="SÁB 24"
            time="09h00 – 10h00"
          />
        </Panel>
        <div className="info-banner">
          <Icon name="sparkles" />
          <div>
            <h3>Planeje a próxima descoberta.</h3>
            <p>
              Os planos ajudam a adaptar cada experiência à pessoa que vai
              vivê-la.
            </p>
          </div>
          <PrimaryButton onClick={() => go("/professor/criar")}>
            Planejar encontro <Icon name="arrow" size={17} />
          </PrimaryButton>
        </div>
      </>
    )
  if (section === "participantes")
    return (
      <>
        <PageIntro
          eyebrow="PESSOAS, NÃO NÚMEROS"
          title="Participantes"
          desc="Conheça os interesses e os diferentes ritmos de quem vive a música com você."
        />
        <div className="cards-two">
          {[
            [
              "MA",
              "Marina Alves",
              "Piano & descoberta",
              "Gosta de referências visuais e músicas conhecidas.",
            ],
            [
              "LF",
              "Lucas Ferreira",
              "Piano & descoberta",
              "Explora pela escuta e gosta de improvisar.",
            ],
            [
              "LA",
              "Luiza Andrade",
              "Voz em movimento",
              "Interessa-se por canto coletivo e expressão.",
            ],
          ].map(([initial, name, exp, desc]) => (
            <Panel className="participant-card" key={name}>
              <div className="participant-head">
                <span className="participant-avatar">{initial}</span>
                <div>
                  <h3>{name}</h3>
                  <p>{exp}</p>
                </div>
              </div>
              <p className="participant-desc">{desc}</p>
              <button
                className="card-link"
                onClick={() => go("/professor/criar")}
              >
                Planejar experiência <Icon name="arrow" size={17} />
              </button>
            </Panel>
          ))}
        </div>
      </>
    )
  if (section === "criar")
    return (
      <>
        <PageIntro
          eyebrow="CRIE COM INTENÇÃO"
          title="Planejar experiência"
          desc="Parta da escuta e do interesse de cada pessoa para planejar encontros que fazem sentido."
        />
        <div className="portal-two-cols">
          <Panel>
            <form
              className="form-stack"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                if (!title.trim() || !goal.trim()) return
                update((d) => ({
                  ...d,
                  plans: [
                    ...d.plans,
                    {
                      id: Date.now(),
                      student,
                      title: title.trim(),
                      goal: goal.trim(),
                    },
                  ],
                }))
                setTitle("")
                setGoal("")
                setNotice("Experiência planejada e adicionada à lista.")
              }}
            >
              <label>
                Participante
                <select
                  value={student}
                  onChange={(e) => setStudent(e.target.value)}
                >
                  <option>Marina Alves</option>
                  <option>Lucas Ferreira</option>
                  <option>Luiza Andrade</option>
                </select>
              </label>
              <label>
                Nome da experiência
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Descobrindo o próprio ritmo"
                />
              </label>
              <label>
                O que vamos explorar?
                <textarea
                  required
                  rows={5}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Sensações, materiais, formas de participação..."
                />
              </label>
              <PrimaryButton type="submit">
                Salvar planejamento <Icon name="check" size={18} />
              </PrimaryButton>
              {notice && (
                <p role="status" className="form-feedback">
                  {notice}
                </p>
              )}
            </form>
          </Panel>
          <Panel className="aside-tip">
            <div className="aside-tip-icon">
              <Icon name="compass" size={25} />
            </div>
            <h2>Espaço para experimentar.</h2>
            <p>
              Um bom encontro nasce de possibilidades, não de expectativas
              rígidas.
            </p>
            <div className="tip-line">
              <Icon name="check" size={17} /> Adapte a cada participante
            </div>
            <div className="tip-line">
              <Icon name="check" size={17} /> Valorize a descoberta
            </div>
            <div className="tip-line">
              <Icon name="check" size={17} /> Observe a expressão individual
            </div>
          </Panel>
        </div>
        <div className="portal-section-title">
          <div>
            <p className="eyebrow">REGISTROS</p>
            <h2>Meus planejamentos</h2>
          </div>
        </div>
        <div className="cards-two">
          {data.plans.map((p) => (
            <Panel key={p.id}>
              <Pill tone="positive">Salvo</Pill>
              <h3 className="mt-title">{p.title}</h3>
              <p className="panel-sub">
                <strong>{p.student}</strong> · {p.goal}
              </p>
            </Panel>
          ))}
        </div>
      </>
    )
  if (section === "materiais")
    return (
      <>
        <PageIntro
          eyebrow="MÚSICA PARA ALÉM DO ENCONTRO"
          title="Materiais compartilhados"
          desc="Inspire novas descobertas com atividades e referências que podem ser exploradas no tempo de cada pessoa."
        />
        <div className="portal-two-cols">
          <Panel>
            <h2>Biblioteca musical</h2>
            <p className="panel-sub">
              Materiais demonstrativos disponíveis para os participantes
            </p>
            <div className="resource-list">
              {data.materials.map((m) => (
                <div className="resource-row" key={m.id}>
                  <div className="resource-icon">
                    <Icon name="folder" size={21} />
                  </div>
                  <div>
                    <strong>{m.title}</strong>
                    <span>{m.type}</span>
                  </div>
                  <Pill tone="positive">Disponível</Pill>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <h2>Adicionar material</h2>
            <p className="panel-sub">
              Cadastro simulado — nenhum arquivo é enviado.
            </p>
            <form
              className="form-stack spaced-form"
              onSubmit={(e) => {
                e.preventDefault()
                if (!material.trim()) return
                update((d) => ({
                  ...d,
                  materials: [
                    ...d.materials,
                    { id: Date.now(), title: material.trim(), type },
                  ],
                }))
                setMaterial("")
                setNotice("Material adicionado à biblioteca.")
              }}
            >
              <label>
                Título do material
                <input
                  required
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Ex.: Sons que encontramos na cidade"
                />
              </label>
              <label>
                Formato
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Guia de prática</option>
                  <option>Áudio + transcrição</option>
                  <option>Vídeo + descrição</option>
                  <option>Atividade impressa</option>
                </select>
              </label>
              <PrimaryButton type="submit">
                Adicionar à biblioteca <Icon name="plus" size={18} />
              </PrimaryButton>
              {notice && (
                <p className="form-feedback" role="status">
                  {notice}
                </p>
              )}
            </form>
          </Panel>
        </div>
      </>
    )
  return (
    <>
      <PageIntro
        eyebrow="O DIÁLOGO FAZ PARTE"
        title="Mensagens"
        desc="Acompanhe ideias e mantenha a conexão com a comunidade."
      />
      <Messages data={data} update={update} sender="Rafael" />
    </>
  )
}

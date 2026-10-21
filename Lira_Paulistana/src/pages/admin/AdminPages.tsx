import { useState } from "react"
import { AgendaRow, type UpdateData } from "../../components/PortalBits"
import { Icon, PageIntro, Panel, Pill } from "../../components/UI"
import {
  experiences,
  type DemoData,
  type Go,
  type RequestStatus,
} from "../../data/mock"
import { downloadCSV } from "./analytics/csv"
import DataImport from "./analytics/pages/DataImport"
import Occurrences from "./analytics/pages/Occurrences"
import Overview from "./analytics/pages/Overview"
import Quality from "./analytics/pages/Quality"
import Regional from "./analytics/pages/Regional"
import Reports from "./analytics/pages/Reports"
import Retention from "./analytics/pages/Retention"
import SiteUsage from "./analytics/pages/SiteUsage"

type Props = {
  section: string
  go: Go
  data: DemoData
  update: UpdateData
}
const statusTone = (s: RequestStatus) =>
  s === "Confirmada" ? "positive" : s === "Recusada" ? "negative" : "warning"
export default function AdminPages({ section, go, data, update }: Props) {
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState("")
  const pending =
    Object.values(data.approvedTeachers).filter((v) => v === "Pendente")
      .length + data.enrollments.filter((v) => v.status === "Pendente").length
  const approve = (name: string, value: RequestStatus) => {
    update((d) => ({
      ...d,
      approvedTeachers: { ...d.approvedTeachers, [name]: value },
    }))
    setNotice(`Solicitação de ${name}: ${value.toLowerCase()}.`)
  }
  const approveEnroll = (id: number, value: RequestStatus) => {
    update((d) => ({
      ...d,
      enrollments: d.enrollments.map((e) =>
        e.id === id ? { ...e, status: value } : e,
      ),
    }))
    setNotice("Solicitação atualizada.")
  }
  const exportCSV = () => {
    const rows = [
      ["Tipo", "Nome", "Situação"],
      ...data.enrollments.map((e) => [
        "Experiência",
        experiences.find((x) => x.id === e.experienceId)?.name ||
          e.experienceId,
        e.status,
      ]),
      ...Object.entries(data.approvedTeachers).map(([n, s]) => [
        "Professor",
        n,
        s,
      ]),
    ]
    downloadCSV("lira-solicitacoes.csv", rows)
  }
  if (section === "home") return <Overview go={go} pending={pending} />
  if (section === "retencao") return <Retention go={go} />
  if (section === "experiencias") return <Quality go={go} />
  if (section === "regional") return <Regional go={go} />
  if (section === "ocorrencias") return <Occurrences go={go} />
  if (section === "dados") return <DataImport />
  if (section === "uso-do-site") return <SiteUsage go={go} />
  if (section === "relatorios")
    return <Reports go={go} exportOperational={exportCSV} />
  if (section === "agenda")
    return (
      <>
        <PageIntro
          eyebrow="TUDO EM HARMONIA"
          title="Agenda geral"
          desc="Encontros de demonstração previstos para os próximos dias."
        />
        <Panel>
          <div className="panel-heading">
            <h2>Programação da Lira</h2>
            <Pill>Próximos encontros</Pill>
          </div>
          <AgendaRow
            name="Piano & descoberta"
            person="Rafael Costa · Marina Alves"
            date="SEX 23"
            time="10h00"
          />
          <AgendaRow
            name="Piano & descoberta"
            person="Rafael Costa · Lucas Ferreira"
            date="SEX 23"
            time="14h00"
          />
          <AgendaRow
            name="Cordas que conectam"
            person="Beatriz Lima · Turma A"
            date="SÁB 24"
            time="09h00"
          />
          {data.enrollments
            .filter((e) => e.experienceId !== "piano")
            .map((e) => (
              <AgendaRow
                key={e.id}
                name={
                  experiences.find((x) => x.id === e.experienceId)?.name ||
                  "Experiência"
                }
                person={e.name}
                date="A DEF"
                time="A confirmar"
                status={e.status}
              />
            ))}
        </Panel>
      </>
    )
  if (section === "alunos") {
    const students = [
      ["Marina Alves", "Piano", "Ativa"],
      ["Lucas Ferreira", "Piano", "Ativo"],
      ["Luiza Andrade", "Canto", "Ativa"],
      ["João Pedro", "Violão", "Ativo"],
    ].filter((row) =>
      row.join(" ").toLowerCase().includes(search.toLowerCase()),
    )
    return (
      <>
        <PageIntro
          eyebrow="CADA PESSOA CONTA"
          title="Alunos"
          desc="Acompanhamento de participantes com dados inteiramente fictícios."
        />
        <Panel>
          <div className="panel-heading">
            <h2>Participantes cadastrados</h2>
            <div className="search-field">
              <Icon name="search" size={17} />
              <input
                aria-label="Buscar aluno"
                placeholder="Buscar pelo nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="simple-table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Interesse</th>
                  <th>Vínculo</th>
                </tr>
              </thead>
              <tbody>
                {students.map(([n, t, s]) => (
                  <tr key={n}>
                    <td>
                      <strong>{n}</strong>
                    </td>
                    <td>{t}</td>
                    <td>
                      <Pill tone="positive">{s}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <p className="empty-small">Nenhum participante encontrado.</p>
            )}
          </div>
        </Panel>
      </>
    )
  }
  if (section === "professores")
    return (
      <>
        <PageIntro
          eyebrow="NOSSA EQUIPE"
          title="Gestão de professores"
          desc="Revise cadastros demonstrativos de profissionais que desejam participar."
        />
        <Panel>
          <div className="panel-heading">
            <h2>Solicitações de verificação</h2>
            <Pill tone="warning">
              {
                Object.values(data.approvedTeachers).filter(
                  (s) => s === "Pendente",
                ).length
              }{" "}
              pendente(s)
            </Pill>
          </div>
          <div className="approval-list">
            {Object.entries(data.approvedTeachers).map(([name, status]) => (
              <div className="approval-row" key={name}>
                <div className="participant-avatar">
                  {name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="approval-info">
                  <strong>{name}</strong>
                  <p>
                    {name.startsWith("Beatriz")
                      ? "Violão e musicalização"
                      : "Percussão e criação"}
                  </p>
                </div>
                <Pill tone={statusTone(status)}>{status}</Pill>
                {status === "Pendente" && (
                  <div className="approval-actions">
                    <button
                      className="small-accept"
                      onClick={() => approve(name, "Confirmada")}
                    >
                      Aprovar
                    </button>
                    <button
                      className="small-reject"
                      onClick={() => approve(name, "Recusada")}
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {notice && (
            <p role="status" className="form-feedback">
              {notice}
            </p>
          )}
        </Panel>
      </>
    )
  if (section === "solicitacoes")
    return (
      <>
        <PageIntro
          eyebrow="OUVIR E ORGANIZAR"
          title="Solicitações"
          desc="Pedidos de participação nas experiências da Lira, com ações simuladas."
        />
        <Panel>
          <div className="panel-heading">
            <h2>Novos pedidos</h2>
            <Pill tone="warning">
              {data.enrollments.filter((e) => e.status === "Pendente").length}{" "}
              aguardando
            </Pill>
          </div>
          <div className="approval-list">
            {data.enrollments.map((e) => (
              <div className="approval-row" key={e.id}>
                <div className="request-symbol">
                  <Icon name="music" size={19} />
                </div>
                <div className="approval-info">
                  <strong>{e.name}</strong>
                  <p>
                    {experiences.find((x) => x.id === e.experienceId)?.name}
                  </p>
                </div>
                <Pill tone={statusTone(e.status)}>{e.status}</Pill>
                {e.status === "Pendente" && (
                  <div className="approval-actions">
                    <button
                      className="small-accept"
                      onClick={() => approveEnroll(e.id, "Confirmada")}
                    >
                      Confirmar
                    </button>
                    <button
                      className="small-reject"
                      onClick={() => approveEnroll(e.id, "Recusada")}
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {notice && (
            <p className="form-feedback" role="status">
              {notice}
            </p>
          )}
        </Panel>
      </>
    )
  return <Overview go={go} pending={pending} />
}

import { useState, type FormEvent } from "react"
import { Icon, Panel, Pill, PrimaryButton } from "./UI"
import type { DemoData } from "../data/mock"

export type UpdateData = (fn: (d: DemoData) => DemoData) => void
export function Messages({
  data,
  update,
  sender,
}: {
  data: DemoData
  update: UpdateData
  sender: string
}) {
  const [text, setText] = useState("")
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!text.trim()) return
    update((d) => ({
      ...d,
      messages: [
        ...d.messages,
        { id: Date.now(), from: sender, text: text.trim(), date: "Agora" },
      ],
    }))
    setText("")
  }
  return (
    <div className="portal-two-cols">
      <Panel>
        <div className="panel-heading">
          <div>
            <h2>Conversa da comunidade</h2>
            <p>Mensagens de demonstração entre participantes</p>
          </div>
          <Pill tone="positive">Ativa</Pill>
        </div>
        <div className="messages-list" aria-live="polite">
          {data.messages.map((m) => (
            <div
              className={`message-item ${
                m.from === sender ? "message-item--own" : ""
              }`}
              key={m.id}
            >
              <div className="message-avatar">{m.from.slice(0, 1)}</div>
              <div className="message-bubble">
                <div>
                  <strong>{m.from}</strong>
                  <span>{m.date}</span>
                </div>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <form className="message-compose" onSubmit={submit}>
          <label className="sr-only" htmlFor="new-message">
            Escrever mensagem
          </label>
          <input
            id="new-message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva sua mensagem..."
            required
          />
          <PrimaryButton type="submit">
            <Icon name="arrow" size={19} />
            <span className="sr-only">Enviar mensagem</span>
          </PrimaryButton>
        </form>
      </Panel>
      <Panel className="aside-tip">
        <div className="aside-tip-icon">
          <Icon name="heart" size={25} />
        </div>
        <h2>Uma comunicação que aproxima.</h2>
        <p>
          Compartilhe descobertas, dúvidas e ideias. Nesta versão, as mensagens
          ficam somente neste navegador.
        </p>
        <div className="tip-line">
          <Icon name="check" size={17} /> Acolhimento em cada troca
        </div>
        <div className="tip-line">
          <Icon name="check" size={17} /> Espaço para se expressar
        </div>
      </Panel>
    </div>
  )
}
export function AgendaRow({
  name,
  person,
  date,
  time,
  status = "Confirmada",
}: {
  name: string
  person: string
  date: string
  time: string
  status?: string
}) {
  return (
    <div className="agenda-row">
      <div className="agenda-date">
        <span>{date.split(" ")[0]}</span>
        <strong>{date.split(" ")[1] || "23"}</strong>
      </div>
      <div className="agenda-row-desc">
        <strong>{name}</strong>
        <p>{person}</p>
      </div>
      <div className="agenda-time">
        <Icon name="clock" size={15} />
        {time}
      </div>
      <Pill
        tone={
          status === "Confirmada"
            ? "positive"
            : status === "Recusada"
              ? "negative"
              : "warning"
        }
      >
        {status}
      </Pill>
    </div>
  )
}

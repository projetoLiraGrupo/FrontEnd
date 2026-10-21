import { useState } from "react"
import { Button, Card, H1, H2, Field } from "./ui"
import type { Go } from "./data/mock"
import {
  STUDENT_PROFILES,
  TEACHER_PROFILES,
  SCALE,
  TEACHERS,
  EXAMPLE_ANSWERS,
  intensities,
  compatibility,
  num,
  signed,
  band,
} from "./perfil"

/* ---------- Componentes locais ---------- */
function Steps({ step }: { step: number }) {
  const labels = [
    "Dados do aluno",
    "Questionário de perfil",
    "Professores recomendados",
  ]
  return (
    <ol className="grid gap-2 sm:grid-cols-3" aria-label="Etapas do cadastro">
      {labels.map((l, i) => {
        const state = i < step ? "done" : i === step ? "current" : "next"
        return (
          <li
            key={l}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              state === "current"
                ? "border-brand bg-paper font-semibold shadow-sm"
                : state === "done"
                  ? "border-brand/25 bg-brand-soft"
                  : "border-line bg-paper/60 text-muted"
            }`}
          >
            <span
              aria-hidden
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-sm ${
                state === "next"
                  ? "bg-sand text-muted"
                  : "bg-brand text-on-brand"
              }`}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span>
              {l}
              <span className="sr-only">
                {state === "done" ? " (concluída)" : ""}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

type MeterProps = {
  value: number
  label: string
}
function Meter({ value, label }: MeterProps) {
  return (
    <div
      className="relative h-2 rounded-full bg-sand"
      role="img"
      aria-label={label}
    >
      <span
        aria-hidden
        className="absolute inset-y-[-3px] left-1/2 w-px bg-ink/30"
      />
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-brand"
        style={{
          width: `${Math.max(0, Math.min(100, ((value + 2) / 4) * 100))}%`,
        }}
      />
    </div>
  )
}

/* ---------- Tela ---------- */
export default function CadastroAluno({ go }: { go: Go }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("Marina Alves")
  const [age, setAge] = useState("11")
  const [inst, setInst] = useState("Piano")
  const [resp, setResp] = useState(1)
  const [ans, setAns] = useState<(number | null)[]>(Array(20).fill(null))
  const [onlyInst, setOnlyInst] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [openCalc, setOpenCalc] = useState<string | null>(null)

  const to = (s: number) => {
    setStep(s)
    window.scrollTo(0, 0)
  }
  const answered = ans.filter((a) => a !== null).length
  const A = intensities(ans)
  const adult = Number(age) >= 18
  const first = name.split(" ")[0] || "aluno"
  const ranked = TEACHERS.map((t) => ({ ...t, m: compatibility(A, t.P) })).sort(
    (a, b) => (b.m.C ?? -9) - (a.m.C ?? -9),
  )
  const shown = onlyInst ? ranked.filter((t) => t.inst === inst) : ranked
  const dominant = A.map((a, i) => ({ a, i }))
    .filter((x) => x.a > 0)
    .sort((a, b) => b.a - a.a)
    .slice(0, 2)

  return (
    <div className="space-y-8">
      <H1 sub="Cadastro de demonstração: os dados e as respostas são fictícios e não são armazenados.">
        Cadastro do aluno
      </H1>
      <Steps step={step} />

      {/* Etapa 1 — dados */}
      <div hidden={step !== 0}>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <H2>Dados do aluno</H2>
            <form
              className="mt-5 grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                to(1)
              }}
            >
              <Field
                className="md:col-span-2"
                label="Nome completo"
                required
                value={name}
                onValueChange={setName}
                placeholder="Nome do aluno"
              />
              <Field
                label="Idade"
                required
                type="number"
                min={4}
                max={99}
                value={age}
                onValueChange={setAge}
              />
              <Field
                label="Instrumento de interesse"
                value={inst}
                onValueChange={setInst}
                options={["Piano", "Violão", "Canto"]}
              />
              <Field
                className="md:col-span-2"
                label="E-mail de acesso"
                required
                type="email"
                defaultValue="familia.alves@exemplo.com"
              />
              <Field
                label="Senha"
                required
                type="password"
                defaultValue="demonstracao"
              />
              <Field
                label="Nível musical"
                options={["Iniciante", "Intermediário", "Avançado"]}
              />
              {!adult &&
                Array.from({ length: resp }, (_, i) => (
                  <Field
                    key={i}
                    className="md:col-span-2"
                    label={`Responsável ${i + 1}`}
                    required={i === 0}
                    defaultValue={
                      i === 0
                        ? "Carla Alves • mãe • (11) 90000-0000"
                        : undefined
                    }
                    placeholder="Nome • vínculo • contato do responsável"
                  />
                ))}
              <Field
                className="md:col-span-2"
                label="Preferências e necessidades de aprendizagem"
                textarea
                rows={2}
                defaultValue="Gosta de apoio visual e de instruções curtas."
              />
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button variant="primary">Continuar para o questionário</Button>
                {!adult && (
                  <Button type="button" onClick={() => setResp(resp + 1)}>
                    + Adicionar responsável
                  </Button>
                )}
              </div>
            </form>
          </Card>
          <Card tone="sand" className="self-start">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Como funciona
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-snug">
              Um perfil com várias dimensões, não um rótulo.
            </h2>
            <p className="mt-3 text-muted">
              Depois dos dados, {first} responde 20 afirmações sobre como gosta
              de aprender música. As respostas formam a intensidade de cinco
              perfis, que são cruzados com o perfil de ensino de cada professor.
            </p>
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              A recomendação apoia a conversa pedagógica. Ela não inclui nem
              exclui nenhum professor.
            </p>
          </Card>
        </div>
      </div>

      {/* Etapa 2 — questionário */}
      <div hidden={step !== 1}>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <Card tone="brand">
              <p className="font-semibold">
                Responda conforme o quanto cada afirmação representa a
                experiência ou a preferência de {first} ao aprender música.
              </p>
              <p className="mt-1 text-sm text-muted">
                Não há respostas certas. Escala de −2 (discordo totalmente) a +2
                (concordo totalmente). Prefere uma afirmação por vez?{" "}
                <button
                  type="button"
                  className="font-semibold text-brand-ink underline"
                  onClick={() => go("questionario")}
                >
                  Abrir o questionário completo
                </button>
                .
              </p>
            </Card>
            {STUDENT_PROFILES.map((p, gi) => (
              <Card key={p.id}>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                  Parte {gi + 1} de 5 · {p.name}
                </p>
                <p className="mt-1 text-sm text-muted">{p.desc}</p>
                {p.id === "A3" && adult && (
                  <p className="mt-3 rounded-lg bg-sand px-3 py-2 text-sm">
                    Para maiores de idade ou sem apoio familiar, responda com
                    tranquilidade: a ausência de envolvimento da família não
                    reduz a compatibilidade com nenhum professor.
                  </p>
                )}
                <div className="mt-2 divide-y divide-line">
                  {p.qs.map((q, qi) => {
                    const n = gi * 4 + qi
                    return (
                      <fieldset
                        key={q}
                        className="grid gap-3 py-4 md:grid-cols-[1fr_minmax(0,25rem)] md:items-center"
                      >
                        <legend className="sr-only">{`Afirmação ${n + 1}: ${q}`}</legend>
                        <p aria-hidden className="flex gap-3">
                          <span className="font-display text-muted">
                            {String(n + 1).padStart(2, "0")}
                          </span>
                          <span>{q}</span>
                        </p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {SCALE.map(([v, l]) => {
                            const sel = ans[n] === v
                            return (
                              <label
                                key={v}
                                title={l}
                                className={`cursor-pointer rounded-lg border px-1 py-2 text-center transition-colors has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-accent ${
                                  sel
                                    ? "border-brand bg-brand text-on-brand"
                                    : "border-line bg-paper hover:border-ink"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q${n}`}
                                  value={v}
                                  checked={sel}
                                  onChange={() =>
                                    setAns(ans.map((a, k) => (k === n ? v : a)))
                                  }
                                  className="sr-only"
                                />
                                <span className="block font-display text-base font-semibold">
                                  {signed(v, 0) || "0"}
                                </span>
                                <span
                                  className={`block text-[0.68rem] leading-tight ${
                                    sel ? "text-on-brand" : "text-muted"
                                  }`}
                                >
                                  {l.split(" ")[0]}
                                  <span className="sr-only">
                                    {" "}
                                    {l.split(" ").slice(1).join(" ")}
                                  </span>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </fieldset>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <p className="text-sm font-semibold">Progresso</p>
              <p
                className="mt-1 font-display text-4xl font-semibold"
                aria-live="polite"
              >
                {answered}
                <span className="text-lg text-muted"> / 20</span>
              </p>
              <div className="mt-3 h-2 rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${(answered / 20) * 100}%` }}
                />
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {STUDENT_PROFILES.map((p, i) => {
                  const c = ans
                    .slice(i * 4, i * 4 + 4)
                    .filter((a) => a !== null).length
                  return (
                    <li key={p.id} className="flex justify-between">
                      <span className={c === 4 ? "" : "text-muted"}>
                        {p.name}
                      </span>
                      <span className="font-semibold">{c}/4</span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-5 space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={answered < 20}
                  aria-disabled={answered < 20}
                  onClick={() => to(2)}
                >
                  Ver professores recomendados
                </Button>
                {answered < 20 && (
                  <p className="text-center text-xs text-muted">
                    Responda todas as afirmações para continuar.
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={() => setAns(EXAMPLE_ANSWERS)}
                >
                  Preencher com respostas de exemplo
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => to(0)}
                >
                  Voltar aos dados
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* Etapa 3 — recomendações */}
      <div hidden={step !== 2}>
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                Perfil de aprendizagem
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-snug">
                {name || "Aluno"}
              </h2>
              <p className="text-sm text-muted">
                {age} anos · {inst}
              </p>
              {dominant.length > 0 && (
                <p className="mt-4 text-sm">
                  Mais presentes:{" "}
                  <strong>
                    {dominant
                      .map((d) => STUDENT_PROFILES[d.i].name)
                      .join(" e ")}
                  </strong>
                  .
                </p>
              )}
              <ul className="mt-5 space-y-3.5">
                {STUDENT_PROFILES.map((p, i) => (
                  <li key={p.id}>
                    <div className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="font-semibold tabular-nums">
                        {Math.round(A[i] * 100)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-sand">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${A[i] * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
                Cada intensidade vai de 0% a 100% e é independente das outras:
                elas não precisam somar 100%.
              </p>
            </Card>
            <Card tone="sand">
              <p className="text-sm font-semibold">Sobre a recomendação</p>
              <p className="mt-2 text-sm text-muted">
                Compatibilidade C entre −2 e +2, combinando todos os perfis do
                aluno com todos os perfis do professor. Os pesos da matriz são
                uma proposta de trabalho e precisam de validação pela equipe
                pedagógica.
              </p>
            </Card>
          </div>

          <section className="space-y-5" aria-labelledby="rec-t">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="rec-t" className="font-display text-2xl font-semibold">
                  Professores recomendados
                </h2>
                <p className="text-muted">
                  Ordenados pela compatibilidade com o perfil de {first}.
                </p>
              </div>
              <div
                role="group"
                aria-label="Filtrar por instrumento"
                className="flex gap-2"
              >
                <Button
                  variant={onlyInst ? "secondary" : "primary"}
                  aria-pressed={!onlyInst}
                  onClick={() => setOnlyInst(false)}
                >
                  Todos
                </Button>
                <Button
                  variant={onlyInst ? "primary" : "secondary"}
                  aria-pressed={onlyInst}
                  onClick={() => setOnlyInst(true)}
                >
                  Apenas {inst}
                </Button>
              </div>
            </div>
            {A.every((a) => a === 0) && (
              <Card tone="sand">
                <p className="font-semibold">Compatibilidade indeterminada</p>
                <p className="mt-1 text-sm text-muted">
                  As respostas não indicaram presença de nenhum perfil.
                  Sugerimos uma conversa com a coordenação para orientar a
                  escolha.
                </p>
              </Card>
            )}
            {shown.length === 0 && (
              <Card>
                <p className="text-muted">
                  Nenhum professor de {inst} disponível no momento.
                </p>
              </Card>
            )}
            {shown.map((t, idx) => {
              const { C, S, W, pos, neg, top, worst } = t.m
              const best = idx === 0 && C !== null
              const isChosen = chosen === t.name
              const tp = t.P.map((v, j) => ({ v, j }))
                .sort((a, b) => b.v - a.v)
                .slice(0, 2)
              return (
                <Card
                  key={t.name}
                  className={`grid gap-5 md:grid-cols-[96px_1fr_210px] ${
                    best ? "ring-2 ring-brand" : ""
                  } ${isChosen ? "bg-brand-soft" : ""}`}
                >
                  <div
                    role="img"
                    aria-label={`Foto de ${t.name}`}
                    className="grid aspect-square place-items-center rounded-xl bg-brand-soft font-display text-2xl text-brand-ink md:aspect-[4/5]"
                  >
                    {t.name.slice(-2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold">
                        {t.name}
                      </h3>
                      {best && (
                        <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-on-brand">
                          Mais compatível
                        </span>
                      )}
                      {t.inst === inst && (
                        <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold">
                          {t.inst}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-brand-ink">
                      {t.inst} ·{" "}
                      {tp.map((x) => TEACHER_PROFILES[x.j]).join(" · ")}
                    </p>
                    <p className="mt-2 text-sm text-muted">{t.bio}</p>
                    {C !== null && (
                      <div className="mt-4 text-sm">
                        <p className="font-semibold">Por que combina</p>
                        <ul className="mt-1 space-y-0.5 text-muted">
                          {top.map((x) => (
                            <li key={`${x.i}${x.j}`}>
                              {STUDENT_PROFILES[x.i].name} ×{" "}
                              {TEACHER_PROFILES[x.j]}{" "}
                              <span className="font-semibold text-ink tabular-nums">
                                {signed(x.v)}
                              </span>
                            </li>
                          ))}
                          {worst && (
                            <li>
                              Ponto de atenção: {STUDENT_PROFILES[worst.i].name}{" "}
                              × {TEACHER_PROFILES[worst.j]}{" "}
                              <span className="font-semibold text-ink tabular-nums">
                                {signed(worst.v)}
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    {openCalc === t.name && (
                      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl bg-sand px-4 py-3 text-sm tabular-nums sm:grid-cols-4">
                        <div>
                          <dt className="text-muted">S positiva</dt>
                          <dd className="font-semibold">{signed(pos, 3)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">S negativa</dt>
                          <dd className="font-semibold">{signed(neg, 3)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">S total</dt>
                          <dd className="font-semibold">{signed(S, 3)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted">W (peso)</dt>
                          <dd className="font-semibold">{num(W, 3)}</dd>
                        </div>
                        <p className="col-span-full mt-1 text-xs text-muted">
                          C = S ÷ W, somando as 25 influências I = A × P × R.
                        </p>
                      </dl>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Compatibilidade
                      </p>
                      {C === null ? (
                        <p className="mt-1 font-semibold">Indeterminada</p>
                      ) : (
                        <>
                          <p className="mt-1 flex items-baseline gap-2">
                            <span className="font-display text-3xl font-semibold tabular-nums">
                              {signed(C)}
                            </span>
                            <span className="text-sm font-semibold text-brand-ink">
                              {band(C)}
                            </span>
                          </p>
                          <div className="mt-2">
                            <Meter
                              value={C}
                              label={`Compatibilidade ${signed(C)} em uma escala de −2 a +2`}
                            />
                          </div>
                        </>
                      )}
                      <p className="mt-2 text-xs text-muted">{t.slot}</p>
                    </div>
                    <Button
                      variant="ghost"
                      aria-expanded={openCalc === t.name}
                      onClick={() =>
                        setOpenCalc(openCalc === t.name ? null : t.name)
                      }
                    >
                      {openCalc === t.name ? "Ocultar cálculo" : "Ver cálculo"}
                    </Button>
                    <Button
                      variant={isChosen ? "primary" : "secondary"}
                      aria-pressed={isChosen}
                      onClick={() => setChosen(isChosen ? null : t.name)}
                    >
                      {isChosen
                        ? "✓ Professor escolhido"
                        : "Escolher professor"}
                    </Button>
                  </div>
                </Card>
              )
            })}
            <Card
              tone="brand"
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold">
                  {chosen
                    ? `${chosen} selecionado(a) para a experiência musical inicial.`
                    : "Escolha um professor para solicitar a experiência musical inicial."}
                </p>
                <p className="text-sm text-muted">
                  O professor recebe o perfil de {first} e confirma a
                  experiência pela agenda.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => to(1)}>Revisar respostas</Button>
                <Button
                  variant="primary"
                  disabled={!chosen}
                  onClick={() => go("agendar")}
                >
                  Solicitar experiência musical
                </Button>
                <Button variant="primary" onClick={() => go("portal-aluno")}>
                  Concluir cadastro
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}

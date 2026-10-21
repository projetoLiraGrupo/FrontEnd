import { useEffect, useRef, useState } from "react"
import { Button, Card, H1 } from "./ui"
import type { Go } from "./data/mock"
import {
  STUDENT_PROFILES,
  TEACHER_PROFILES,
  SCALE,
  TEACHERS,
  EXAMPLE_ANSWERS,
  intensities,
  compatibility,
  signed,
  band,
} from "./perfil"

const QUESTIONS = STUDENT_PROFILES.flatMap((p, gi) =>
  p.qs.map((q, qi) => ({ text: q, group: gi, n: gi * 4 + qi })),
)

export default function Questionario({ go }: { go: Go }) {
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro")
  const [cur, setCur] = useState(0)
  const [ans, setAns] = useState<(number | null)[]>(Array(20).fill(null))
  const heading = useRef<HTMLHeadingElement>(null)

  const answered = ans.filter((a) => a !== null).length
  const q = QUESTIONS[cur]
  const profile = STUDENT_PROFILES[q.group]

  const move = (i: number) => setCur(Math.max(0, Math.min(19, i)))
  const choose = (v: number) => {
    const next = ans.map((a, k) => (k === cur ? v : a))
    setAns(next)
    if (cur < 19) move(cur + 1)
  }
  const finish = () => {
    setPhase("result")
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    if (phase === "quiz") heading.current?.focus()
  }, [cur, phase])
  useEffect(() => {
    if (phase !== "quiz") return
    const k = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input, textarea, select, [role="dialog"]')
      )
        return
      const idx = ["1", "2", "3", "4", "5"].indexOf(e.key)
      if (idx >= 0) choose(SCALE[idx][0])
      else if (e.key === "ArrowRight") move(cur + 1)
      else if (e.key === "ArrowLeft") move(cur - 1)
    }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  })

  /* ---------- Introdução ---------- */
  if (phase === "intro") {
    return (
      <div className="space-y-8">
        <H1 sub="Cerca de 5 minutos · 20 afirmações · resultado imediato">
          Questionário de perfil de aprendizagem
        </H1>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card className="p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Antes de começar
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight">
              Como você gosta de aprender música?
            </h2>
            <p className="mt-4 max-w-xl text-muted">
              Responda a cada afirmação conforme o quanto ela representa sua
              experiência ou preferência. Não há respostas certas: o resultado
              mostra a presença de cinco perfis e ajuda a equipe da Lira a
              indicar professores com um jeito de ensinar compatível.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                variant="primary"
                className="px-6"
                onClick={() => {
                  setPhase("quiz")
                  setCur(
                    ans.findIndex((a) => a === null) === -1
                      ? 0
                      : ans.findIndex((a) => a === null),
                  )
                }}
              >
                {answered ? "Continuar questionário" : "Começar questionário"}
              </Button>
              <Button
                onClick={() => {
                  setAns(EXAMPLE_ANSWERS)
                  finish()
                }}
              >
                Ver resultado de exemplo
              </Button>
            </div>
          </Card>
          <Card tone="sand">
            <p className="text-sm font-semibold">Escala de respostas</p>
            <ol className="mt-4 space-y-2">
              {SCALE.map(([v, l]) => (
                <li
                  key={v}
                  className="flex items-center gap-3 rounded-xl bg-paper px-4 py-2.5"
                >
                  <span className="w-8 font-display text-lg font-semibold text-brand-ink">
                    {signed(v, 0)}
                  </span>
                  <span>{l}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-muted">
              Pelo teclado: teclas 1 a 5 escolhem a resposta; setas navegam
              entre as afirmações.
            </p>
          </Card>
        </div>
        <section aria-labelledby="perfis-t">
          <h2 id="perfis-t" className="font-display text-xl font-semibold">
            O que o questionário observa
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STUDENT_PROFILES.map((p, i) => (
              <li
                key={p.id}
                className="surface-card rounded-2xl border border-line bg-paper p-5"
              >
                <span className="font-display text-sm text-accent">
                  0{i + 1}
                </span>
                <p className="mt-1 font-semibold leading-snug">{p.name}</p>
                <p className="mt-2 text-sm text-muted">{p.desc}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  }

  /* ---------- Resultado ---------- */
  if (phase === "result") {
    const A = intensities(ans)
    const order = A.map((a, i) => ({ a, i })).sort((x, y) => y.a - x.a)
    const lead = order.filter((x) => x.a > 0).slice(0, 2)
    const ranked = TEACHERS.map((t) => ({ ...t, m: compatibility(A, t.P) }))
      .sort((a, b) => (b.m.C ?? -9) - (a.m.C ?? -9))
      .slice(0, 3)
    return (
      <div className="space-y-8">
        <H1 sub="Resultado de demonstração. Ele apoia a conversa pedagógica e não é um diagnóstico.">
          Seu perfil de aprendizagem
        </H1>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card tone="brand" className="p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Perfis mais presentes
            </p>
            {lead.length ? (
              <>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight">
                  {lead.map((x) => STUDENT_PROFILES[x.i].name).join(" e ")}
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {lead.map((x) => (
                    <div key={x.i} className="rounded-xl bg-paper/70 p-4">
                      <p className="font-display text-2xl font-semibold text-brand-ink">
                        {Math.round(x.a * 100)}%
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {STUDENT_PROFILES[x.i].desc}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-lg">
                As respostas não indicaram a presença de nenhum perfil. A
                compatibilidade fica indeterminada; sugerimos uma conversa com a
                coordenação.
              </p>
            )}
          </Card>
          <Card>
            <p className="text-sm font-semibold">
              Intensidade dos cinco perfis
            </p>
            <ul className="mt-5 space-y-4">
              {STUDENT_PROFILES.map((p, i) => (
                <li key={p.id}>
                  <div className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="font-semibold tabular-nums">
                      {Math.round(A[i] * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${A[i] * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted">
              Os perfis são independentes e não precisam somar 100%. Discordar
              ou ficar neutro reduz a presença do perfil, sem torná-la negativa.
            </p>
          </Card>
        </div>

        {lead.length > 0 && (
          <section aria-labelledby="top-t" className="space-y-4">
            <h2 id="top-t" className="font-display text-2xl font-semibold">
              Professores com maior compatibilidade
            </h2>
            <ol className="grid gap-4 md:grid-cols-3">
              {ranked.map((t, i) => (
                <li
                  key={t.name}
                  className={`surface-card flex flex-col rounded-2xl border bg-paper p-5 ${
                    i === 0 ? "border-brand ring-1 ring-brand" : "border-line"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft font-display text-lg text-brand-ink"
                    >
                      {t.name.slice(-2)}
                    </span>
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-muted">
                        {t.inst} · {t.slot}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-brand-ink">
                    {t.P.map((v, j) => ({ v, j }))
                      .sort((a, b) => b.v - a.v)
                      .slice(0, 2)
                      .map((x) => TEACHER_PROFILES[x.j])
                      .join(" · ")}
                  </p>
                  <p className="mt-auto flex items-baseline gap-2 pt-4">
                    <span className="font-display text-3xl font-semibold tabular-nums">
                      {t.m.C === null ? "—" : signed(t.m.C)}
                    </span>
                    <span className="text-sm font-semibold text-brand-ink">
                      {t.m.C === null ? "Indeterminada" : band(t.m.C)}
                    </span>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <Card
          tone="sand"
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <p className="max-w-lg text-sm text-muted">
            Use o resultado no cadastro para ver todos os professores, o cálculo
            detalhado e solicitar uma experiência musical inicial.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setPhase("quiz")
                setCur(0)
              }}
            >
              Revisar respostas
            </Button>
            <Button onClick={() => go("professores")}>
              Conhecer professores
            </Button>
            <Button variant="primary" onClick={() => go("cadastro-aluno")}>
              Continuar para o cadastro
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  /* ---------- Questionário ---------- */
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <H1>Questionário de perfil</H1>
        <p className="text-sm text-muted" aria-live="polite">
          <strong className="text-ink">{answered}</strong> de 20 respondidas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <Card className="p-6 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-semibold uppercase tracking-widest text-accent">
              Parte {q.group + 1} de 5 · {profile.name}
            </p>
            <p className="text-muted">
              Afirmação {String(cur + 1).padStart(2, "0")} de 20
            </p>
          </div>
          <div aria-hidden className="mt-4 grid grid-cols-20 gap-1">
            {QUESTIONS.map((x) => (
              <span
                key={x.n}
                className={`h-1.5 rounded-full ${
                  x.n === cur
                    ? "bg-ink"
                    : ans[x.n] !== null
                      ? "bg-brand"
                      : "bg-sand"
                }`}
              />
            ))}
          </div>

          <h2
            ref={heading}
            tabIndex={-1}
            className="mt-10 min-h-[6.5rem] font-display text-3xl font-semibold leading-tight focus:outline-none md:text-4xl"
          >
            <span className="sr-only">{`Afirmação ${cur + 1} de 20: `}</span>
            {q.text}
          </h2>

          <div
            role="radiogroup"
            aria-label="Sua resposta"
            className="mt-8 grid gap-2.5 sm:grid-cols-5"
          >
            {SCALE.map(([v, l], i) => {
              const sel = ans[cur] === v
              return (
                <button
                  key={v}
                  role="radio"
                  aria-checked={sel}
                  onClick={() => choose(v)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors sm:flex-col sm:items-start sm:gap-2 sm:py-4 ${
                    sel
                      ? "border-brand bg-brand text-on-brand"
                      : "border-line bg-paper hover:border-ink"
                  }`}
                >
                  <span className="font-display text-2xl font-semibold">
                    {signed(v, 0)}
                  </span>
                  <span
                    className={`text-sm leading-snug ${
                      sel ? "text-on-brand" : "text-muted"
                    }`}
                  >
                    {l}
                  </span>
                  <span
                    aria-hidden
                    className={`ml-auto text-xs sm:ml-0 ${
                      sel ? "text-on-brand/80" : "text-subtle"
                    }`}
                  >
                    tecla {i + 1}
                  </span>
                </button>
              )
            })}
          </div>

          {q.group === 2 && (
            <p className="mt-6 rounded-xl bg-sand px-4 py-3 text-sm text-muted">
              Maior de idade ou sem apoio da família? Responda com
              tranquilidade: isso não reduz sua compatibilidade com nenhum
              professor.
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <Button onClick={() => move(cur - 1)} disabled={cur === 0}>
              ‹ Anterior
            </Button>
            {answered === 20 ? (
              <Button variant="primary" className="px-6" onClick={finish}>
                Ver meu resultado
              </Button>
            ) : (
              <Button onClick={() => move(cur + 1)} disabled={cur === 19}>
                Próxima ›
              </Button>
            )}
          </div>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <p className="text-sm font-semibold">Mapa do questionário</p>
            <ol className="mt-4 space-y-4">
              {STUDENT_PROFILES.map((p, gi) => (
                <li key={p.id}>
                  <p
                    className={`text-sm ${
                      gi === q.group ? "font-semibold" : "text-muted"
                    }`}
                  >
                    {p.name}
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    {[0, 1, 2, 3].map((qi) => {
                      const n = gi * 4 + qi
                      return (
                        <button
                          key={n}
                          onClick={() => move(n)}
                          aria-label={`Ir para a afirmação ${n + 1}${
                            ans[n] !== null ? ", respondida" : ""
                          }`}
                          aria-current={n === cur ? "step" : undefined}
                          className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-semibold ${
                            n === cur
                              ? "border-ink bg-ink text-paper"
                              : ans[n] !== null
                                ? "border-brand bg-brand-soft text-brand-ink"
                                : "border-line bg-paper text-muted hover:border-ink"
                          }`}
                        >
                          {n + 1}
                        </button>
                      )
                    })}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 space-y-2 border-t border-line pt-4">
              <Button
                variant="primary"
                className="w-full"
                disabled={answered < 20}
                onClick={finish}
              >
                Ver meu resultado
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setAns(EXAMPLE_ANSWERS)
                  setCur(19)
                }}
              >
                Preencher com exemplo
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

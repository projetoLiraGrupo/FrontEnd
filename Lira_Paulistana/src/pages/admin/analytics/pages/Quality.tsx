import { useMemo, useState } from "react"
import { Pill } from "../../../../components/UI"
import type { Go } from "../../../../data/mock"
import {
  DataTable,
  HBars,
  LineChart,
  Scatter,
  SERIES,
  Stacked100,
} from "../charts"
import {
  byTeacher,
  dimensions,
  engagementSeries,
  fmtNum,
  fmtPct,
  fmtScore,
  getCtx,
  intentByModality,
  rangeLabel,
  satisfaction,
  satisfactionVsContinuity,
} from "../metrics"
import { useAnalytics } from "../store"
import { DIMENSIONS, ORIGEM_LABEL, type Origem } from "../types"
import {
  AnalyticsFrame,
  ChartCard,
  DetailStats,
  KpiCard,
  Segmented,
} from "../widgets"

const ORIGENS: Origem[] = ["aluno", "responsavel", "professor"]
const score = (v: number) => fmtScore(v).replace(",00", "")

export default function Quality({ go }: { go: Go }) {
  const { dataset, filters, settings: s } = useAnalytics()
  const ctx = getCtx(dataset, filters)
  const [origem, setOrigem] = useState<Origem | "">("")
  const [teacher, setTeacher] = useState("")
  const d = useMemo(
    () => ({
      sat: [satisfaction(ctx, ctx.range), satisfaction(ctx, ctx.prev)],
      bySource: ctx.buckets.map((b) =>
        ORIGENS.map((o) => satisfaction(ctx, b, o)),
      ),
      teachers: byTeacher(ctx, ctx.range, s),
      scatter: satisfactionVsContinuity(ctx, ctx.range, s),
      intent: intentByModality(ctx, ctx.range),
      engagement: engagementSeries(ctx),
    }),
    [ctx, s],
  )
  const dims = dimensions(ctx, ctx.range, origem)
  const dimsPrev = dimensions(ctx, ctx.prev, origem)
  const [sat, satPrev] = d.sat
  const intentDim = dims[3]
  const intentPrev = dimsPrev[3]
  const intentShare = (x: typeof intentDim) =>
    x.n ? (x.dist[3] + x.dist[4]) / x.n : null
  const period = rangeLabel(ctx.range)
  const t = d.teachers.find((x) => x.professor === teacher)

  return (
    <AnalyticsFrame
      ctx={ctx}
      go={go}
      eyebrow="ANÁLISE · QUALIDADE"
      title="Experiências e professores"
      desc="Como alunos, responsáveis e professores avaliam as experiências, e como isso se relaciona à continuidade. Use para orientar formação e apoio, não para ranqueamento punitivo."
    >
      <div className="kpi-grid kpi-grid--four">
        <KpiCard
          label="Satisfação média"
          icon="star"
          status={sat.status}
          need={sat.need}
          value={`${fmtScore(sat.mean)} / 5`}
          detail={`n = ${fmtNum(sat.n)} avaliações`}
          delta={{
            current: sat.mean,
            previous: satPrev.mean,
            kind: "score",
            better: "up",
          }}
          goal={
            sat.mean === null
              ? undefined
              : {
                  text: `Meta ≥ ${score(s.metaSatisfacao)}`,
                  met: sat.mean >= s.metaSatisfacao,
                }
          }
          formula="Média das notas válidas (1 a 5) nas cinco dimensões, de todas as origens."
          unit="nota de 1 a 5"
          period={period}
        />
        <KpiCard
          label="Taxa de resposta"
          icon="message"
          status={
            sat.responseRate === null
              ? sat.status === "ok"
                ? "indisponivel"
                : sat.status
              : "ok"
          }
          need={sat.need || "participacoes.csv"}
          value={fmtPct(sat.responseRate)}
          detail={`${fmtNum(sat.answers)} respostas de alunos e responsáveis`}
          delta={{
            current: sat.responseRate,
            previous: satPrev.responseRate,
            kind: "rate",
            better: "up",
          }}
          goal={
            sat.responseRate === null
              ? undefined
              : {
                  text: `Meta ≥ ${s.metaResposta}%`,
                  met: sat.responseRate * 100 >= s.metaResposta,
                }
          }
          formula="Avaliações de alunos e responsáveis ÷ participações realizadas no período"
          unit="percentual"
          period={period}
        />
        <KpiCard
          label="Interesse em continuar"
          icon="heart"
          status={
            intentDim.n
              ? "ok"
              : sat.status === "ok"
                ? "insuficiente"
                : sat.status
          }
          need={sat.need}
          value={fmtPct(intentShare(intentDim))}
          detail={`notas 4 ou 5 · n = ${intentDim.n}`}
          delta={{
            current: intentShare(intentDim),
            previous: intentShare(intentPrev),
            kind: "rate",
            better: "up",
          }}
          formula="Respostas com nota 4 ou 5 em “interesse em continuar” ÷ respostas válidas nessa dimensão"
          unit="percentual"
          period={period}
        />
        <KpiCard
          label="Professores com amostra suficiente"
          icon="user"
          status={d.teachers.length ? "ok" : "insuficiente"}
          value={`${d.teachers.filter((x) => !x.small).length} de ${d.teachers.length}`}
          detail={`Amostra mínima: ${s.amostraMinima} avaliações no período`}
          formula="Professores com ao menos a quantidade mínima configurada de avaliações no período"
          unit="professores"
          period={period}
        />
      </div>

      <div className="dash-section-title">
        <div>
          <p className="eyebrow">QUALIDADE POR DIMENSÃO</p>
          <h2>Onde a experiência se destaca e onde melhorar</h2>
        </div>
        <Segmented
          label="Origem da avaliação"
          value={origem}
          onChange={setOrigem}
          options={[
            ["", "Todas"],
            ...ORIGENS.map((o) => [o, ORIGEM_LABEL[o]] as [Origem, string]),
          ]}
        />
      </div>

      <div className="dash-grid-2">
        <ChartCard
          title="Média por dimensão"
          desc={DIMENSIONS.map((x) => x.label).join(" · ")}
          meta={[
            "Unidade: nota 1–5",
            `Origem: ${origem ? ORIGEM_LABEL[origem] : "todas"}`,
          ]}
          status={sat.status}
          need={sat.need}
        >
          <HBars
            max={5}
            goal={{
              value: s.metaSatisfacao,
              label: `Meta ${score(s.metaSatisfacao)}`,
            }}
            rows={dims.map((x) => ({
              label: x.label,
              value: x.mean,
              display:
                x.mean === null ? "Dados insuficientes" : fmtScore(x.mean),
              sub: `n = ${x.n}`,
              muted: x.n < s.amostraMinima,
              tip: [x.question, `Média: ${fmtScore(x.mean)}`, `n = ${x.n}`],
            }))}
          />
        </ChartCard>
        <ChartCard
          title="Distribuição das respostas"
          desc="Proporção de cada nota, de 1 (discordo totalmente) a 5 (concordo totalmente)."
          meta={["Unidade: % das respostas"]}
          legend={[1, 2, 3, 4, 5].map((n, i) => ({
            label: `Nota ${n}`,
            color: [
              "var(--negative)",
              "var(--chart-5)",
              "var(--border-strong)",
              "var(--chart-2)",
              "var(--chart-1)",
            ][i],
          }))}
          status={sat.status}
          need={sat.need}
        >
          <Stacked100
            labels={[1, 2, 3, 4, 5].map((n) => `Nota ${n}`)}
            colors={[
              "var(--negative)",
              "var(--chart-5)",
              "var(--border-strong)",
              "var(--chart-2)",
              "var(--chart-1)",
            ]}
            rows={dims.map((x) => ({
              label: x.label,
              values: x.dist,
              sub: `n = ${x.n}`,
            }))}
          />
        </ChartCard>
      </div>

      <ChartCard
        eyebrow="TENDÊNCIA"
        title="Satisfação por origem ao longo do período"
        meta={[
          "Unidade: nota 1–5",
          "Pontos ausentes: intervalo sem avaliações",
        ]}
        legend={ORIGENS.map((o, i) => ({
          label: ORIGEM_LABEL[o],
          color: SERIES[i],
        }))}
        status={sat.status}
        need={sat.need}
      >
        <LineChart
          ariaLabel="Satisfação média por origem ao longo do período"
          labels={ctx.buckets.map((b) => b.label)}
          series={ORIGENS.map((o, i) => ({
            label: ORIGEM_LABEL[o],
            color: SERIES[i],
            dashed: o === "professor",
            values: d.bySource.map((row) => row[i].mean),
            n: d.bySource.map((row) => row[i].n),
          }))}
          min={1}
          max={5}
          format={score}
          goal={{
            value: s.metaSatisfacao,
            label: `Meta ${score(s.metaSatisfacao)}`,
          }}
        />
      </ChartCard>

      <ChartCard
        eyebrow="PROFESSORES"
        title="Qualidade por professor"
        desc="Ordem alfabética. Selecione um professor para ver as dimensões e as origens das avaliações."
        meta={[
          `Amostra mínima: ${s.amostraMinima} avaliações`,
          "Variação: comparação com o período anterior",
        ]}
        status={sat.status}
        need={sat.need}
        note="Indicadores de apoio pedagógico. Médias com amostra pequena são instáveis e não devem orientar decisões sobre pessoas."
      >
        <div className="simple-table-wrap">
          <table className="simple-table dash-table">
            <caption className="sr-only">
              Qualidade das experiências por professor
            </caption>
            <thead>
              <tr>
                <th scope="col">Professor</th>
                <th scope="col">Modalidades</th>
                <th scope="col" className="num">
                  Nota média
                </th>
                <th scope="col" className="num">
                  Avaliações
                </th>
                <th scope="col" className="num">
                  Taxa de resposta
                </th>
                <th scope="col" className="num">
                  Presença
                </th>
                <th scope="col" className="num">
                  Variação
                </th>
              </tr>
            </thead>
            <tbody>
              {d.teachers.map((x) => (
                <tr
                  key={x.professor}
                  className={`is-clickable ${
                    teacher === x.professor ? "is-selected" : ""
                  }`}
                  onClick={() =>
                    setTeacher(teacher === x.professor ? "" : x.professor)
                  }
                >
                  <th scope="row">
                    <button
                      type="button"
                      className="card-link"
                      aria-pressed={teacher === x.professor}
                    >
                      {x.professor}
                    </button>
                  </th>
                  <td>{x.modalidades.join(", ")}</td>
                  <td className="num">
                    {x.mean === null ? "Dados insuficientes" : fmtScore(x.mean)}{" "}
                    {x.small && x.n > 0 && (
                      <Pill tone="warning">amostra pequena</Pill>
                    )}
                  </td>
                  <td className="num">{x.n}</td>
                  <td className="num">{fmtPct(x.responseRate)}</td>
                  <td className="num">{fmtPct(x.presence)}</td>
                  <td className="num">
                    {x.mean === null || x.prevMean === null
                      ? "—"
                      : `${
                          x.mean - x.prevMean >= 0 ? "+" : ""
                        }${fmtScore(x.mean - x.prevMean)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {t && (
          <div
            className="detail-panel"
            style={{ marginTop: 14 }}
            aria-live="polite"
          >
            <h3>
              {t.professor} · {t.modalidades.join(", ")}
            </h3>
            <DetailStats
              items={t.bySource
                .map(
                  (b) =>
                    [
                      `${ORIGEM_LABEL[b.origem]} (n = ${b.n})`,
                      b.n ? fmtScore(b.mean) : "Sem respostas",
                    ] as [string, string],
                )
                .concat([["Presença nas aulas", fmtPct(t.presence)]])}
            />
            <HBars
              max={5}
              rows={DIMENSIONS.map((x, i) => ({
                label: x.label,
                value: t.dims[i],
                display:
                  t.dims[i] === null
                    ? "Dados insuficientes"
                    : fmtScore(t.dims[i]),
                muted: t.small,
              }))}
            />
          </div>
        )}
      </ChartCard>

      <div className="dash-grid-2">
        <ChartCard
          eyebrow="SATISFAÇÃO × CONTINUIDADE"
          title="Avaliação e presença por professor e modalidade"
          desc="Cada ponto é uma combinação professor · modalidade; o tamanho indica o número de avaliações. Contorno tracejado: amostra pequena."
          meta={["Eixo X: nota média", "Eixo Y: presença"]}
          status={
            d.scatter.length
              ? "ok"
              : sat.status === "ok"
                ? "insuficiente"
                : sat.status
          }
          need={sat.need}
          note="Correlação não implica causalidade."
        >
          <Scatter
            ariaLabel="Dispersão entre satisfação média e presença"
            points={d.scatter.map((p) => ({
              label: p.label,
              x: p.x as number,
              y: p.y as number,
              n: p.n,
              small: p.small,
            }))}
            xLabel="Satisfação média"
            yLabel="Presença"
            formatX={(v) => fmtScore(v).replace(/0$/, "")}
            formatY={(v) => fmtPct(v, 0)}
          />
          <DataTable
            caption="Satisfação e presença por professor e modalidade"
            columns={[
              "Professor · modalidade",
              "Nota média",
              "Presença",
              "Avaliações",
            ]}
            rows={d.scatter.map((p) => [
              p.label,
              fmtScore(p.x),
              fmtPct(p.y),
              p.n,
            ])}
          />
        </ChartCard>
        <ChartCard
          eyebrow="ENGAJAMENTO"
          title="Presença e intenção de continuar"
          desc="Intenção = notas 4 ou 5 em “interesse em continuar” (alunos e responsáveis)."
          meta={["Unidade: %"]}
          legend={[
            { label: "Presença", color: SERIES[1] },
            { label: "Intenção de continuar", color: SERIES[3] },
          ]}
          status={
            sat.status === "ok" || ctx.has("participacoes") ? "ok" : sat.status
          }
          need={sat.need}
        >
          <LineChart
            ariaLabel="Presença e intenção de continuar ao longo do período"
            labels={d.engagement.map((e) => e.label)}
            series={[
              {
                label: "Presença",
                color: SERIES[1],
                values: d.engagement.map((e) => e.presence),
                n: d.engagement.map((e) => e.presenceN),
              },
              {
                label: "Intenção de continuar",
                color: SERIES[3],
                values: d.engagement.map((e) => e.intent),
                n: d.engagement.map((e) => e.intentN),
              },
            ]}
            min={0.4}
            max={1}
            format={(v) => fmtPct(v, 0)}
            height={200}
          />
          <HBars
            color={SERIES[3]}
            max={1}
            rows={d.intent.map((x) => ({
              label: x.label,
              value: x.rate,
              display:
                x.rate === null ? "Dados insuficientes" : fmtPct(x.rate, 0),
              sub: `n = ${x.n}`,
              muted: x.n < s.amostraMinima,
            }))}
          />
        </ChartCard>
      </div>
    </AnalyticsFrame>
  )
}

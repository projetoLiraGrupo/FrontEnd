import { useMemo, useState } from "react"
import { Icon, Pill } from "../../../../components/UI"
import type { Go } from "../../../../data/mock"
import { ColumnChart, DataTable, HBars, Pareto, SERIES } from "../charts"
import { iso } from "../dates"
import {
  cancelReasons,
  cancellations,
  dropoutReasons,
  fmtNum,
  fmtPct,
  followList,
  getCtx,
  occurrenceSeries,
  presence,
  rangeLabel,
} from "../metrics"
import { actions, useAnalytics } from "../store"
import { SIDE_LABEL, type CancelSide, type FollowState } from "../types"
import { AnalyticsFrame, ChartCard, KpiCard, Segmented } from "../widgets"

const STATE_LABEL: Record<FollowState, string> = {
  pendente: "Pendente",
  em_contato: "Em contato",
  resolvida: "Resolvida",
}

export default function Occurrences({ go }: { go: Go }) {
  const { dataset, filters, settings: s, followups } = useAnalytics()
  const ctx = getCtx(dataset, filters)
  const [kind, setKind] = useState<"cancel" | "dropout">("cancel")
  const [side, setSide] = useState<CancelSide | "">("")
  const [showResolved, setShowResolved] = useState(false)
  const d = useMemo(
    () => ({
      pres: [presence(ctx, ctx.range), presence(ctx, ctx.prev)],
      canc: [cancellations(ctx, ctx.range), cancellations(ctx, ctx.prev)],
      series: occurrenceSeries(ctx),
      follow: followList(ctx, ctx.range, s),
    }),
    [ctx, s],
  )
  const [pres, presPrev] = d.pres
  const [canc, cancPrev] = d.canc
  const period = rangeLabel(ctx.range)
  const reasons =
    kind === "cancel"
      ? cancelReasons(ctx, ctx.range, side)
      : dropoutReasons(ctx, ctx.range)
  const reasonsStatus =
    kind === "cancel"
      ? canc.status === "indisponivel"
        ? "indisponivel"
        : reasons.length
          ? "ok"
          : "insuficiente"
      : !ctx.has("desistencias")
        ? "indisponivel"
        : reasons.length
          ? "ok"
          : "insuficiente"
  const followRows = d.follow.filter(
    (f) => showResolved || followups[f.id]?.estado !== "resolvida",
  )
  const resolved =
    d.follow.length -
    d.follow.filter((f) => followups[f.id]?.estado !== "resolvida").length

  const sideCard = (k: Exclude<CancelSide, "nao_informado">, icon: string) => (
    <KpiCard
      label={`Cancelamentos ${SIDE_LABEL[k].toLowerCase()}`}
      icon={icon}
      status={canc.status}
      need={canc.need}
      value={fmtNum(canc.bySide[k])}
      detail={`${fmtPct(canc.scheduled ? canc.bySide[k] / canc.scheduled : null)} dos ${fmtNum(canc.scheduled)} encontros programados`}
      delta={{
        current: canc.bySide[k],
        previous: cancPrev.bySide[k],
        kind: "count",
        better: "down",
      }}
      formula={`Encontros cancelados cujo responsável registrado é “${k}”. Não são contados como falta do aluno.`}
      unit="encontros"
      period={period}
    />
  )

  return (
    <AnalyticsFrame
      ctx={ctx}
      go={go}
      eyebrow="ANÁLISE · OCORRÊNCIAS"
      title="Ocorrências e acompanhamento"
      desc="Faltas e cancelamentos são registrados separadamente: falta é a ausência do aluno em um encontro realizado; cancelamento é o encontro que não aconteceu, por iniciativa do aluno, do professor ou da escola."
    >
      <div className="kpi-grid kpi-grid--four">
        <KpiCard
          label="Faltas do aluno"
          icon="clock"
          status={pres.status}
          need={pres.need}
          value={fmtNum(pres.absent)}
          detail={`${fmtNum(pres.unjust)} sem justificativa · ${fmtPct(pres.expected ? pres.absent / pres.expected : null)} das participações previstas`}
          delta={{
            current: pres.absent,
            previous: presPrev.absent,
            kind: "count",
            better: "down",
          }}
          formula="Participações previstas em encontros realizados em que o aluno não esteve presente"
          unit="faltas"
          period={period}
        />
        {sideCard("aluno", "user")}
        {sideCard("professor", "music")}
        {sideCard("escola", "home")}
      </div>
      {canc.bySide.nao_informado > 0 && (
        <p className="filter-warning">
          <Icon name="alert" size={15} /> {canc.bySide.nao_informado}{" "}
          cancelamento(s) sem responsável informado: revise os registros de
          origem.
        </p>
      )}

      <ChartCard
        eyebrow="AO LONGO DO PERÍODO"
        title="Faltas e cancelamentos"
        meta={[
          "Unidade: ocorrências",
          "Cancelamentos sem origem são somados a “Pela escola” neste gráfico",
        ]}
        legend={[
          { label: "Faltas do aluno", color: SERIES[2] },
          { label: "Canc. pelo aluno", color: SERIES[0] },
          { label: "Canc. pelo professor", color: SERIES[4] },
          { label: "Canc. pela escola", color: SERIES[5] },
        ]}
        status={
          canc.status === "ok" || pres.status === "ok" ? "ok" : canc.status
        }
        need={canc.need}
      >
        <ColumnChart
          ariaLabel="Faltas e cancelamentos por intervalo"
          labels={d.series.map((x) => x.label)}
          stacked
          series={[
            {
              label: "Faltas do aluno",
              color: SERIES[2],
              values: d.series.map((x) => x.faltas),
            },
            {
              label: "Canc. pelo aluno",
              color: SERIES[0],
              values: d.series.map((x) => x.aluno),
            },
            {
              label: "Canc. pelo professor",
              color: SERIES[4],
              values: d.series.map((x) => x.professor),
            },
            {
              label: "Canc. pela escola",
              color: SERIES[5],
              values: d.series.map((x) => x.escola),
            },
          ]}
          format={(v) => fmtNum(v)}
        />
        <DataTable
          caption="Faltas e cancelamentos por intervalo"
          columns={[
            "Intervalo",
            "Faltas",
            "Pelo aluno",
            "Pelo professor",
            "Pela escola",
          ]}
          rows={d.series.map((x) => [
            x.label,
            x.faltas,
            x.aluno,
            x.professor,
            x.escola,
          ])}
        />
      </ChartCard>

      <div className="dash-section-title">
        <div>
          <p className="eyebrow">MOTIVOS</p>
          <h2>
            {kind === "cancel"
              ? "Motivos de cancelamento"
              : "Motivos de desistência"}
          </h2>
        </div>
        <div className="inline-actions">
          <Segmented
            label="Tipo de ocorrência"
            value={kind}
            onChange={setKind}
            options={[
              ["cancel", "Cancelamentos"],
              ["dropout", "Desistências"],
            ]}
          />
          {kind === "cancel" && (
            <Segmented
              label="Responsável pelo cancelamento"
              value={side}
              onChange={setSide}
              options={[
                ["", "Todos"],
                ["aluno", "Aluno"],
                ["professor", "Professor"],
                ["escola", "Escola"],
              ]}
            />
          )}
        </div>
      </div>
      <div className="dash-grid-2">
        <ChartCard
          title="Ranking dos motivos"
          desc="Motivos padronizados; o exemplo mostra o texto declarado mais frequente."
          meta={[
            `n = ${fmtNum(reasons.reduce((a, r) => a + r.value, 0))} registros`,
          ]}
          status={reasonsStatus}
          need={kind === "cancel" ? canc.need : "desistencias.csv"}
        >
          <HBars
            color={kind === "cancel" ? SERIES[0] : SERIES[4]}
            rows={reasons.map((r) => ({
              label: r.label,
              value: r.value,
              display: `${r.value} · ${fmtPct(r.share, 0)}`,
              sub: `Ex.: “${r.example}”`,
            }))}
          />
        </ChartCard>
        <ChartCard
          title="Pareto"
          desc="Barras: quantidade. Linha: percentual acumulado. A linha tracejada marca 80%."
          meta={["Eixo esquerdo: ocorrências", "Eixo direito: % acumulado"]}
          status={reasonsStatus}
          need={kind === "cancel" ? canc.need : "desistencias.csv"}
        >
          <Pareto ariaLabel="Pareto dos motivos" items={reasons.slice(0, 8)} />
          <DataTable
            caption="Motivos com participação e acumulado"
            columns={[
              "Motivo",
              "Exemplo de registro",
              "Quantidade",
              "Participação",
              "Acumulado",
            ]}
            rows={reasons.map((r) => [
              r.label,
              r.example,
              r.value,
              fmtPct(r.share),
              fmtPct(r.cumulative),
            ])}
          />
        </ChartCard>
      </div>

      <ChartCard
        eyebrow="ACOMPANHAMENTO"
        title="Alunos com faltas proporcionalmente altas"
        desc={`Alunos ativos com ao menos ${s.minPrevistas} encontros previstos e presença abaixo de ${s.limiteAtencao}% ou ${s.faltasNaoJustificadas}+ faltas sem justificativa. “Atenção”: presença abaixo de ${s.limiteCritico}%.`}
        meta={[
          `${d.follow.length} aluno(s) sinalizado(s)`,
          `${resolved} resolvido(s)`,
          "Identificação pseudonimizada",
        ]}
        status={
          pres.status === "ok" && ctx.has("alunos")
            ? "ok"
            : pres.status === "ok"
              ? "indisponivel"
              : pres.status
        }
        need={pres.need || "alunos.csv"}
        actions={
          <label
            className="filter-field"
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
            <span>Mostrar resolvidos</span>
          </label>
        }
        note={
          <>
            <b>Sinal para avaliação humana.</b> A lista não é uma classificação
            definitiva nem um diagnóstico: confirme o contexto com o professor e
            a família antes de qualquer ação. Acesso restrito à coordenação; o
            registro de contato fica salvo somente neste navegador.
          </>
        }
      >
        {d.follow.length === 0 ? (
          <div className="unavailable unavailable--compact">
            <Icon name="check" size={18} />
            <div>
              <strong>Nenhum aluno sinalizado</strong>
              <p>
                Nenhum aluno atende aos critérios configurados no período e
                filtros selecionados.
              </p>
            </div>
          </div>
        ) : (
          <>
            <HBars
              color={SERIES[2]}
              max={1}
              goal={{
                value: s.limiteAtencao / 100,
                label: `Limite ${s.limiteAtencao}%`,
              }}
              rows={d.follow.slice(0, 10).map((f) => ({
                label: f.id,
                value: f.rate,
                display: `${fmtPct(f.rate, 0)} · ${f.present}/${f.expected}`,
                sub: f.level,
              }))}
            />
            <div className="simple-table-wrap" style={{ marginTop: 16 }}>
              <table className="simple-table dash-table">
                <caption className="sr-only">
                  Alunos sinalizados para acompanhamento
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Aluno</th>
                    <th scope="col">Sinal</th>
                    <th scope="col">Indicador observado</th>
                    <th scope="col">Professor</th>
                    <th scope="col">Região</th>
                    <th scope="col">Último contato</th>
                    <th scope="col">Responsável</th>
                    <th scope="col">Estado da ação</th>
                  </tr>
                </thead>
                <tbody>
                  {followRows.map((f) => {
                    const fu = followups[f.id]
                    return (
                      <tr key={f.id}>
                        <th scope="row" className="mono">
                          {f.id}
                        </th>
                        <td>
                          <Pill
                            tone={
                              f.level === "Atenção" ? "negative" : "warning"
                            }
                          >
                            {f.level}
                          </Pill>
                        </td>
                        <td>{f.signal}</td>
                        <td>{f.professor}</td>
                        <td>{f.regiao}</td>
                        <td>
                          <input
                            type="date"
                            aria-label={`Data do último contato com ${f.id}`}
                            value={fu?.ultimoContato || ""}
                            max={iso(ctx.ref)}
                            onChange={(e) =>
                              actions.setFollowup(f.id, {
                                ultimoContato: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Quem acompanha"
                            aria-label={`Responsável pelo acompanhamento de ${f.id}`}
                            value={fu?.responsavel || ""}
                            onChange={(e) =>
                              actions.setFollowup(f.id, {
                                responsavel: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            aria-label={`Estado da ação para ${f.id}`}
                            value={fu?.estado || "pendente"}
                            onChange={(e) =>
                              actions.setFollowup(f.id, {
                                estado: e.target.value as FollowState,
                              })
                            }
                          >
                            {(Object.keys(STATE_LABEL) as FollowState[]).map(
                              (k) => (
                                <option key={k} value={k}>
                                  {STATE_LABEL[k]}
                                </option>
                              ),
                            )}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ChartCard>
    </AnalyticsFrame>
  )
}

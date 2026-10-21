import { useMemo, useState } from "react"
import { Pill } from "../../../../components/UI"
import type { Go } from "../../../../data/mock"
import {
  ColumnChart,
  DataTable,
  Heatmap,
  HBars,
  LineChart,
  SERIES,
} from "../charts"
import {
  cohorts,
  dropoutReasons,
  dropouts,
  flows,
  fmtNum,
  fmtPct,
  frequencyVsDropout,
  getCtx,
  presence,
  rangeLabel,
  retention,
  type Range,
} from "../metrics"
import { useAnalytics } from "../store"
import { AnalyticsFrame, ChartCard, DetailStats, KpiCard } from "../widgets"

export default function Retention({ go }: { go: Go }) {
  const { dataset, filters, settings: s } = useAnalytics()
  const ctx = getCtx(dataset, filters)
  const [sel, setSel] = useState<number | null>(null)
  const [cohort, setCohort] = useState<string>("")
  const data = useMemo(
    () => ({
      ret: [retention(ctx, ctx.range), retention(ctx, ctx.prev)],
      drop: [dropouts(ctx, ctx.range), dropouts(ctx, ctx.prev)],
      flow: [flows(ctx, ctx.range), flows(ctx, ctx.prev)],
      series: ctx.buckets.map((b) => ({
        b,
        ret: retention(ctx, b),
        flow: flows(ctx, b),
      })),
      cohorts: cohorts(ctx),
      freq: frequencyVsDropout(ctx, ctx.range),
    }),
    [ctx],
  )
  const [ret, retPrev] = data.ret
  const [drop, dropPrev] = data.drop
  const [flow, flowPrev] = data.flow
  const period = rangeLabel(ctx.range)
  const selIdx = sel !== null && sel < data.series.length ? sel : null
  const focus: Range = selIdx === null ? ctx.range : data.series[selIdx].b
  const focusRet = selIdx === null ? ret : data.series[selIdx].ret
  const focusFlow = selIdx === null ? flow : data.series[selIdx].flow
  const focusPres = presence(ctx, focus)
  const reasons = dropoutReasons(ctx, focus).slice(0, 4)
  const cohortRow = data.cohorts.rows.find((r) => r.label === cohort) || null
  const cohortLast = cohortRow
    ? ([...cohortRow.cells].reverse().find((c) => c !== null) ?? null)
    : null

  return (
    <AnalyticsFrame
      ctx={ctx}
      go={go}
      eyebrow="ANÁLISE · RETENÇÃO"
      title="Retenção de alunos"
      desc="Quem permanece, quem sai e quando. Retenção considera apenas alunos ativos no início do período, para não ser inflada por novos ingressos."
    >
      <div className="kpi-grid kpi-grid--four">
        <KpiCard
          label="Taxa de retenção"
          icon="users"
          status={ret.status}
          need={ret.need}
          value={fmtPct(ret.rate)}
          detail={`${ret.retained} de ${ret.base} alunos da base inicial`}
          delta={{
            current: ret.rate,
            previous: retPrev.rate,
            kind: "rate",
            better: "up",
          }}
          goal={
            ret.rate === null
              ? undefined
              : {
                  text: `Meta ≥ ${s.metaRetencao}%`,
                  met: ret.rate * 100 >= s.metaRetencao,
                }
          }
          formula="(alunos ativos no início do período que continuam ativos no fim ÷ alunos ativos no início) × 100"
          unit="percentual"
          period={period}
        />
        <KpiCard
          label="Desistências"
          icon="logout"
          status={drop.status}
          need={drop.need}
          value={fmtNum(drop.count)}
          detail={`${fmtPct(drop.rate)} da base inicial`}
          delta={{
            current: drop.count,
            previous: dropPrev.count,
            kind: "count",
            better: "down",
          }}
          formula="Alunos da base inicial com desligamento efetivado no período"
          unit="alunos"
          period={period}
        />
        <KpiCard
          label="Novos ingressos"
          icon="plus"
          status={ret.status}
          need={ret.need}
          value={fmtNum(flow.ingressos)}
          detail={
            drop.newcomers
              ? `${drop.newcomers} já saíram no mesmo período`
              : "Nenhuma saída entre os recém-ingressos"
          }
          delta={{
            current: flow.ingressos,
            previous: flowPrev.ingressos,
            kind: "count",
            better: "up",
          }}
          formula="Alunos cuja data de ingresso está dentro do período. Não entram no cálculo da retenção."
          unit="alunos"
          period={period}
        />
        <KpiCard
          label="Base inicial"
          icon="database"
          status={ret.status}
          need={ret.need}
          value={fmtNum(ret.base)}
          detail="Alunos ativos no primeiro dia do período"
          delta={{
            current: ret.base,
            previous: retPrev.base,
            kind: "count",
            better: "up",
          }}
          formula="Alunos com ingresso anterior ao início do período e sem desligamento até essa data"
          unit="alunos"
          period={period}
        />
      </div>

      <div className="dash-grid-2">
        <ChartCard
          eyebrow="TENDÊNCIA"
          title="Retenção por intervalo"
          desc="Selecione um ponto para ver o detalhe do intervalo."
          meta={["Unidade: % da base de cada intervalo"]}
          status={ret.status}
          need={ret.need}
        >
          <LineChart
            ariaLabel="Taxa de retenção por intervalo"
            labels={data.series.map((x) => x.b.label)}
            series={[
              {
                label: "Retenção",
                color: SERIES[0],
                values: data.series.map((x) => x.ret.rate),
                n: data.series.map((x) => x.ret.base),
              },
            ]}
            min={
              Math.min(0.6, ...data.series.map((x) => x.ret.rate ?? 1)) - 0.02
            }
            max={1}
            format={(v) => fmtPct(v, 0)}
            goal={{
              value: s.metaRetencao / 100,
              label: `Meta ${s.metaRetencao}%`,
            }}
            selected={selIdx}
            onSelect={(i) => setSel(i === selIdx ? null : i)}
          />
          <DataTable
            caption="Retenção por intervalo"
            columns={["Intervalo", "Base", "Permanecem", "Retenção"]}
            rows={data.series.map((x) => [
              x.b.label,
              x.ret.base,
              x.ret.retained,
              fmtPct(x.ret.rate),
            ])}
          />
        </ChartCard>
        <ChartCard
          eyebrow="FLUXO"
          title="Entradas, permanências e saídas"
          desc="Quantidade de alunos em cada intervalo."
          meta={["Unidade: alunos"]}
          legend={[
            { label: "Permanências", color: SERIES[0] },
            { label: "Ingressos", color: SERIES[1] },
            { label: "Saídas", color: SERIES[2] },
          ]}
          status={ret.status}
          need={ret.need}
        >
          <ColumnChart
            ariaLabel="Ingressos, permanências e saídas por intervalo"
            labels={data.series.map((x) => x.b.label)}
            series={[
              {
                label: "Permanências",
                color: SERIES[0],
                values: data.series.map((x) => x.flow.permanencias),
              },
              {
                label: "Ingressos",
                color: SERIES[1],
                values: data.series.map((x) => x.flow.ingressos),
              },
              {
                label: "Saídas",
                color: SERIES[2],
                values: data.series.map((x) => x.flow.saidas),
              },
            ]}
            format={(v) => fmtNum(v)}
            selected={selIdx}
            onSelect={(i) => setSel(i === selIdx ? null : i)}
          />
          <DataTable
            caption="Fluxo de alunos por intervalo"
            columns={["Intervalo", "Permanências", "Ingressos", "Saídas"]}
            rows={data.series.map((x) => [
              x.b.label,
              x.flow.permanencias,
              x.flow.ingressos,
              x.flow.saidas,
            ])}
          />
        </ChartCard>
      </div>

      {ret.status === "ok" && (
        <div className="detail-panel" aria-live="polite">
          <div className="inline-actions">
            <h3>
              {selIdx === null
                ? `Período completo · ${period}`
                : `Intervalo ${data.series[selIdx].b.label} · ${rangeLabel(focus)}`}
            </h3>
            {selIdx !== null && (
              <button
                type="button"
                className="ghost-button"
                onClick={() => setSel(null)}
              >
                Ver período completo
              </button>
            )}
          </div>
          <DetailStats
            items={[
              ["Alunos considerados", fmtNum(focusRet.base)],
              ["Retenção", fmtPct(focusRet.rate)],
              ["Saídas", fmtNum(focusFlow.saidas)],
              [
                "Presença",
                focusPres.status === "ok"
                  ? fmtPct(focusPres.rate)
                  : focusPres.status === "indisponivel"
                    ? "Não disponível"
                    : "Dados insuficientes",
              ],
            ]}
          />
          <div className="detail-list">
            {reasons.length ? (
              reasons.map((r) => (
                <Pill key={r.label}>
                  {r.label}: {r.value}
                </Pill>
              ))
            ) : (
              <span className="tiny-note">
                {ctx.has("desistencias")
                  ? "Nenhum motivo de desistência registrado neste intervalo."
                  : "Motivos não disponíveis: importe desistencias.csv."}
              </span>
            )}
          </div>
        </div>
      )}

      <ChartCard
        eyebrow="COORTES"
        title="Permanência por mês de ingresso"
        desc="Cada linha agrupa os alunos que ingressaram no mesmo mês; cada coluna mostra o percentual ainda ativo após N meses. Selecione uma coorte para o detalhe."
        meta={[
          "Unidade: % da coorte ainda ativa",
          "Células vazias: período ainda não transcorrido",
        ]}
        status={data.cohorts.status}
        need={data.cohorts.need}
        note={data.cohorts.note || undefined}
      >
        <Heatmap
          rows={data.cohorts.rows}
          cols={data.cohorts.cols}
          colLabel={(k) => `${k + 1}º mês`}
          selected={cohort}
          onSelect={(l) => setCohort(l === cohort ? "" : l)}
        />
        {cohortRow && (
          <div className="detail-panel" style={{ marginTop: 14 }}>
            <h3>Coorte de {cohortRow.label}</h3>
            <DetailStats
              items={[
                ["Ingressaram", fmtNum(cohortRow.size)],
                ["Ainda ativos (último mês medido)", fmtPct(cohortLast, 0)],
                ["Após 1º mês", fmtPct(cohortRow.cells[0], 0)],
                ["Após 3º mês", fmtPct(cohortRow.cells[2], 0)],
              ]}
            />
            {cohortRow.size < s.amostraMinima && (
              <p className="tiny-note">
                Coorte com menos de {s.amostraMinima} alunos: variações
                percentuais podem ser grandes.
              </p>
            )}
          </div>
        )}
      </ChartCard>

      <div className="dash-grid-2">
        <ChartCard
          eyebrow="FREQUÊNCIA × DESISTÊNCIA"
          title="Desistência por faixa de presença"
          desc="Percentual de alunos da base inicial que desistiram no período, conforme a presença anterior à saída."
          meta={[
            "Unidade: % de desistência",
            "Faixas com n abaixo da amostra mínima ficam esmaecidas",
          ]}
          status={data.freq.status}
          need={data.freq.need}
          note="Associação não é causalidade: a faixa ajuda a priorizar conversas, não explica sozinha a saída."
        >
          <HBars
            color={SERIES[2]}
            max={Math.max(0.05, ...data.freq.bands.map((b) => b.rate ?? 0))}
            rows={data.freq.bands.map((b) => ({
              label: b.label,
              value: b.rate,
              display: b.rate === null ? "Dados insuficientes" : fmtPct(b.rate),
              sub: `${b.lost} de ${b.n} alunos`,
              muted: b.n < s.amostraMinima,
            }))}
          />
        </ChartCard>
        <ChartCard
          eyebrow="MOTIVOS"
          title="Por que os alunos saem"
          desc="Motivos padronizados das desistências no período."
          meta={[`n = ${fmtNum(drop.count + drop.newcomers)} desistências`]}
          status={
            ctx.has("desistencias")
              ? dropoutReasons(ctx, ctx.range).length
                ? "ok"
                : "insuficiente"
              : "indisponivel"
          }
          need="desistencias.csv"
          actions={
            <button
              type="button"
              className="card-link"
              onClick={() => go("/admin/ocorrencias")}
            >
              Ver ranking completo
            </button>
          }
        >
          <HBars
            color={SERIES[4]}
            rows={dropoutReasons(ctx, ctx.range)
              .slice(0, 6)
              .map((r) => ({
                label: r.label,
                value: r.value,
                display: `${r.value} · ${fmtPct(r.share, 0)}`,
                sub: `Ex.: “${r.example}”`,
              }))}
          />
        </ChartCard>
      </div>
    </AnalyticsFrame>
  )
}

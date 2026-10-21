import { useMemo, useState } from "react"
import { Icon } from "../../../../components/UI"
import type { Go } from "../../../../data/mock"
import {
  DataTable,
  GroupedHBars,
  HBars,
  LineChart,
  SERIES,
  Stacked100,
} from "../charts"
import {
  cancelByRegion,
  demand,
  fmtNum,
  fmtPct,
  getCtx,
  GROUPED,
  regionalEvolution,
  regions,
} from "../metrics"
import { useAnalytics } from "../store"
import { AnalyticsFrame, ChartCard, DetailStats } from "../widgets"

export default function Regional({ go }: { go: Go }) {
  const { dataset, filters, settings: s } = useAnalytics()
  const ctx = getCtx(dataset, filters)
  const [sel, setSel] = useState("")
  const d = useMemo(() => {
    const reg = regions(ctx, ctx.range, s)
    const canc = cancelByRegion(ctx, ctx.range, reg.groupOf)
    const cats = new Map<string, number>()
    for (const m of canc.values())
      for (const [k, v] of m) cats.set(k, (cats.get(k) || 0) + v)
    const topCats = [...cats.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
    const shown = topCats.slice(0, 4)
    const cancRows = [...canc.entries()]
      .map(([label, m]) => {
        const values = shown.map((c) => m.get(c) || 0)
        const other = [...m.entries()]
          .filter(([k]) => !shown.includes(k))
          .reduce((a, [, v]) => a + v, 0)
        return {
          label,
          values: [...values, other],
          total: values.reduce((a, b) => a + b, other),
        }
      })
      .sort((a, b) => b.total - a.total)
    const dem = demand(ctx, ctx.range, reg.groupOf)
    const top = reg.rows
      .filter((r) => r.label !== GROUPED)
      .slice(0, 5)
      .map((r) => r.label)
    return {
      reg,
      canc,
      shown,
      cancRows,
      dem,
      evo: regionalEvolution(ctx, top, reg.groupOf),
    }
  }, [ctx, s])
  const { reg, dem } = d
  const totalActive = reg.rows.reduce((a, r) => a + r.active, 0)
  const row = reg.rows.find((r) => r.label === sel)
  const selDem = dem.rows.find((r) => r.label === sel)
  const selCanc = d.cancRows.find((r) => r.label === sel)
  const topMotive = [
    ...(d.canc.get(sel) || new Map<string, number>()).entries(),
  ].sort((a, b) => b[1] - a[1])[0]?.[0]
  const toggle = (l: string) => setSel(l === sel ? "" : l)

  return (
    <AnalyticsFrame
      ctx={ctx}
      go={go}
      eyebrow="ANÁLISE · TERRITÓRIO"
      title="Análise regional"
      desc="Onde estão os alunos, onde a permanência é menor e onde há procura não atendida. Selecione uma região em qualquer gráfico para ver o detalhe."
    >
      <div className="source-banner" role="note">
        <Icon name="map" size={18} />
        <p>
          <strong>Privacidade:</strong> são exibidas apenas regiões agregadas
          (bairro, distrito ou zona), sem endereço nem coordenadas. Regiões com
          menos de {s.minRegiao} alunos são agrupadas em “{GROUPED}”
          {reg.smallCount
            ? ` (${reg.smallCount} região(ões) neste filtro)`
            : ""}
          .
        </p>
      </div>

      {row && (
        <div className="detail-panel" aria-live="polite">
          <div className="inline-actions">
            <h3>{row.label}</h3>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setSel("")}
            >
              Limpar seleção
            </button>
          </div>
          <DetailStats
            items={[
              ["Alunos ativos", fmtNum(row.active)],
              [
                "Retenção",
                row.base ? fmtPct(row.retention) : "Dados insuficientes",
              ],
              ["Presença", fmtPct(row.presence)],
              ["Cancelamentos", fmtNum(selCanc?.total ?? 0)],
              [
                "Solicitações",
                dem.status === "indisponivel"
                  ? "Não disponível"
                  : fmtNum(selDem?.total ?? 0),
              ],
              [
                "Lista de espera",
                dem.status === "indisponivel"
                  ? "Não disponível"
                  : fmtNum(selDem?.espera ?? 0),
              ],
              ["Base inicial", fmtNum(row.base)],
              ["Principal motivo de cancelamento", topMotive || "—"],
            ]}
          />
        </div>
      )}

      <div className="dash-grid-2">
        <ChartCard
          eyebrow="DISTRIBUIÇÃO"
          title="Alunos ativos por região"
          meta={[
            "Unidade: alunos ativos no fim do período",
            `Total: ${fmtNum(totalActive)}`,
          ]}
          status={reg.status}
          need={reg.need}
        >
          <HBars
            selected={sel}
            onSelect={toggle}
            rows={reg.rows.map((r) => ({
              label: r.label,
              value: r.active,
              display: `${r.active} · ${fmtPct(totalActive ? r.active / totalActive : null, 0)}`,
            }))}
          />
        </ChartCard>
        <ChartCard
          eyebrow="RETENÇÃO"
          title="Retenção por região"
          desc="Base: alunos de cada região ativos no início do período."
          meta={["Unidade: %", `Meta: ${s.metaRetencao}%`]}
          status={reg.status}
          need={reg.need}
          note="Diferenças regionais podem refletir distância, horários ou oferta; investigue antes de concluir."
        >
          <HBars
            color={SERIES[1]}
            max={1}
            selected={sel}
            onSelect={toggle}
            goal={{
              value: s.metaRetencao / 100,
              label: `Meta ${s.metaRetencao}%`,
            }}
            rows={reg.rows.map((r) => ({
              label: r.label,
              value: r.retention,
              display:
                r.retention === null
                  ? "Dados insuficientes"
                  : fmtPct(r.retention),
              sub: `base ${r.base}`,
              muted: r.base < s.amostraMinima,
            }))}
          />
        </ChartCard>
      </div>

      <div className="dash-grid-2">
        <ChartCard
          eyebrow="PROCURA"
          title="Solicitações, atendimentos e lista de espera"
          meta={["Unidade: pessoas interessadas"]}
          legend={[
            { label: "Solicitações", color: SERIES[0] },
            { label: "Atendidas", color: SERIES[1] },
            { label: "Lista de espera", color: SERIES[4] },
          ]}
          status={dem.status}
          need={dem.need}
        >
          <GroupedHBars
            selected={sel}
            onSelect={toggle}
            series={[
              { label: "Solicitações", color: SERIES[0] },
              { label: "Atendidas", color: SERIES[1] },
              { label: "Lista de espera", color: SERIES[4] },
            ]}
            rows={dem.rows.map((r) => ({
              label: r.label,
              values: [r.total, r.atendido, r.espera],
            }))}
          />
          <DataTable
            caption="Procura por região"
            columns={[
              "Região",
              "Solicitações",
              "Atendidas",
              "Lista de espera",
              "Não atendidas",
            ]}
            rows={dem.rows.map((r) => [
              r.label,
              r.total,
              r.atendido,
              r.espera,
              r.naoAtendido,
            ])}
          />
        </ChartCard>
        <ChartCard
          eyebrow="CANCELAMENTOS"
          title="Motivos de cancelamento por região"
          desc="Composição dos motivos padronizados; o total aparece abaixo do nome."
          meta={["Unidade: % dos cancelamentos da região"]}
          legend={[...d.shown, "Outros"].map((l, i) => ({
            label: l,
            color: SERIES[i],
          }))}
          status={
            ctx.has("experiencias") && ctx.has("participacoes")
              ? d.cancRows.length
                ? "ok"
                : "insuficiente"
              : "indisponivel"
          }
          need="experiencias.csv, participacoes.csv"
        >
          <Stacked100
            labels={[...d.shown, "Outros"]}
            colors={SERIES}
            rows={d.cancRows.map((r) => ({
              label: r.label,
              values: r.values,
              sub: `${r.total} cancelamento(s)`,
            }))}
          />
        </ChartCard>
      </div>

      <ChartCard
        eyebrow="EVOLUÇÃO"
        title="Alunos ativos nas principais regiões"
        meta={[
          "Unidade: alunos ativos ao fim de cada intervalo",
          "5 regiões com mais alunos",
        ]}
        legend={d.evo.map((e, i) => ({ label: e.label, color: SERIES[i] }))}
        status={reg.status}
        need={reg.need}
      >
        <LineChart
          ariaLabel="Evolução dos alunos ativos por região"
          labels={ctx.buckets.map((b) => b.label)}
          series={d.evo.map((e, i) => ({
            label: e.label,
            color: SERIES[i],
            values: e.points.map((p) => p.value),
          }))}
          format={(v) => fmtNum(v)}
        />
      </ChartCard>
    </AnalyticsFrame>
  )
}

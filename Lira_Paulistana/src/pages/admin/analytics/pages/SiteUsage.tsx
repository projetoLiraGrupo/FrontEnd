import type { Go } from "../../../../data/mock"
import { HBars, LineChart, SERIES } from "../charts"
import { fmtNum, fmtPct, getCtx, navigation, rangeLabel } from "../metrics"
import { useAnalytics } from "../store"
import { AnalyticsFrame, ChartCard, KpiCard } from "../widgets"

export default function SiteUsage({ go }: { go: Go }) {
  const { dataset, filters } = useAnalytics()
  const ctx = getCtx(dataset, filters)
  const n = navigation(ctx, ctx.range)
  const prev = navigation(ctx, ctx.prev)
  const period = rangeLabel(ctx.range)
  return (
    <AnalyticsFrame
      ctx={ctx}
      go={go}
      eyebrow="ANÁLISE · SITE"
      title="Uso do site"
      desc="Métricas de navegação do site institucional, a partir de navegacao.csv. Mantidas separadas dos indicadores pedagógicos: acessos não medem aprendizagem nem permanência."
    >
      <div className="kpi-grid kpi-grid--four">
        <KpiCard
          label="Sessões"
          icon="monitor"
          status={n.status}
          need={n.need}
          value={fmtNum(n.sessions)}
          delta={{
            current: n.sessions,
            previous: prev.sessions,
            kind: "count",
            better: "up",
          }}
          formula="Identificadores de sessão distintos no período"
          unit="sessões"
          period={period}
        />
        <KpiCard
          label="Páginas vistas"
          icon="eye"
          status={n.status}
          need={n.need}
          value={fmtNum(n.views)}
          delta={{
            current: n.views,
            previous: prev.views,
            kind: "count",
            better: "up",
          }}
          formula="Eventos do tipo page_view"
          unit="visualizações"
          period={period}
        />
        <KpiCard
          label="Eventos por sessão"
          icon="trend"
          status={n.status}
          need={n.need}
          value={fmtNum(n.perSession, 1)}
          delta={{
            current: n.perSession,
            previous: prev.perSession,
            kind: "score",
            better: "up",
          }}
          formula="Total de eventos ÷ sessões"
          unit="eventos"
          period={period}
        />
        <KpiCard
          label="Conclusão de formulários"
          icon="check"
          status={n.status === "ok" && !n.starts ? "insuficiente" : n.status}
          need={n.need}
          value={fmtPct(n.starts ? n.submits / n.starts : null)}
          detail={`${n.submits} envios de ${n.starts} inícios`}
          formula="Eventos form_submit ÷ eventos form_start"
          unit="percentual"
          period={period}
        />
      </div>
      <ChartCard
        title="Sessões por intervalo"
        meta={["Unidade: sessões"]}
        status={n.status}
        need={n.need}
      >
        <LineChart
          ariaLabel="Sessões por intervalo"
          labels={n.series.map((x) => x.label)}
          series={[
            {
              label: "Sessões",
              color: SERIES[0],
              values: n.series.map((x) => x.value),
            },
          ]}
          format={(v) => fmtNum(v)}
        />
      </ChartCard>
      <div className="dash-grid-2">
        <ChartCard
          title="Páginas mais acessadas"
          meta={["Unidade: visualizações"]}
          status={n.status}
          need={n.need}
        >
          <HBars rows={n.paths.slice(0, 8).map(([label, value]) => ({
              label,
              value,
              display: fmtNum(value),
            }))} />
        </ChartCard>
        <ChartCard
          title="Tipos de evento"
          meta={["Unidade: eventos"]}
          status={n.status}
          need={n.need}
        >
          <HBars
            color={SERIES[1]}
            rows={n.types.map(([label, value]) => ({
              label,
              value,
              display: fmtNum(value),
            }))}
          />
        </ChartCard>
      </div>
    </AnalyticsFrame>
  )
}

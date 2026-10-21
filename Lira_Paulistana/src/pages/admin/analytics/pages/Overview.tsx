import { useMemo } from "react"
import { Icon, Panel, Pill } from "../../../../components/UI"
import type { Go } from "../../../../data/mock"
import { LineChart, SERIES } from "../charts"
import {
  cancellations,
  dimensions,
  demand,
  dropouts,
  followList,
  fmtNum,
  fmtPct,
  fmtScore,
  getCtx,
  presence,
  rangeLabel,
  regions,
  retention,
  satisfaction,
  GROUPED,
} from "../metrics"
import { useAnalytics } from "../store"
import { SIDE_LABEL, type CancelSide } from "../types"
import { AnalyticsFrame, ChartCard, KpiCard } from "../widgets"

type Alert = {
  tone: "negative" | "warning" | "positive"
  title: string
  desc: string
  to: string
}

type OverviewProps = {
  go: Go
  pending: number
}

export default function Overview({ go, pending }: OverviewProps) {
  const { dataset, filters, settings: s } = useAnalytics()
  const ctx = getCtx(dataset, filters)
  const m = useMemo(() => {
    const r = ctx.range
    const p = ctx.prev
    return {
      ret: [retention(ctx, r), retention(ctx, p)],
      drop: [dropouts(ctx, r), dropouts(ctx, p)],
      pres: [presence(ctx, r), presence(ctx, p)],
      canc: [cancellations(ctx, r), cancellations(ctx, p)],
      sat: [satisfaction(ctx, r), satisfaction(ctx, p)],
      follow: [followList(ctx, r, s), followList(ctx, p, s)],
      trend: ctx.buckets.map((b) => ({
        label: b.label,
        ret: retention(ctx, b).rate,
        drop: dropouts(ctx, b).count,
        pres: presence(ctx, b).rate,
        canc: cancellations(ctx, b).rate,
        sat: satisfaction(ctx, b).mean,
        satN: satisfaction(ctx, b).n,
        presN: presence(ctx, b).expected,
      })),
      regions: regions(ctx, r, s),
      dims: dimensions(ctx, r),
    }
  }, [ctx, s])
  const period = rangeLabel(ctx.range)
  const [ret, retPrev] = m.ret
  const [drop, dropPrev] = m.drop
  const [pres, presPrev] = m.pres
  const [canc, cancPrev] = m.canc
  const [sat, satPrev] = m.sat
  const [follow, followPrev] = m.follow
  const attention = follow.filter((f) => f.level === "Atenção").length

  const alerts: Alert[] = []
  if (ret.rate !== null && ret.rate * 100 < s.metaRetencao)
    alerts.push({
      tone: "negative",
      title: `Retenção de ${fmtPct(ret.rate)} — abaixo da meta de ${s.metaRetencao}%`,
      desc: `${ret.lost} de ${ret.base} alunos ativos no início do período se desligaram.`,
      to: "/admin/retencao",
    })
  if (follow.length)
    alerts.push({
      tone: attention ? "negative" : "warning",
      title: `${follow.length} aluno(s) sinalizado(s) para acompanhamento`,
      desc: `${attention} em atenção e ${follow.length - attention} para acompanhar. Sinais para avaliação humana, não classificações definitivas.`,
      to: "/admin/ocorrencias",
    })
  if (pres.rate !== null && pres.rate * 100 < s.metaPresenca)
    alerts.push({
      tone: "warning",
      title: `Presença de ${fmtPct(pres.rate)} — meta de ${s.metaPresenca}%`,
      desc: `${fmtNum(pres.absent)} faltas em ${fmtNum(pres.expected)} participações previstas em encontros realizados.`,
      to: "/admin/ocorrencias",
    })
  if (canc.rate !== null && canc.rate * 100 > s.limiteCancelamento) {
    const top = (Object.entries(canc.bySide) as [CancelSide, number][]).sort(
      (a, b) => b[1] - a[1],
    )[0]
    alerts.push({
      tone: "warning",
      title: `${fmtPct(canc.rate)} dos encontros cancelados — limite de ${s.limiteCancelamento}%`,
      desc: `Maior origem: ${SIDE_LABEL[top[0]].toLowerCase()} (${top[1]}).`,
      to: "/admin/ocorrencias",
    })
  }
  const worstRegion = m.regions.rows
    .filter(
      (r) =>
        r.label !== GROUPED && r.retention !== null && r.base >= s.minRegiao,
    )
    .sort((a, b) => (a.retention ?? 1) - (b.retention ?? 1))[0]
  if (worstRegion && (worstRegion.retention ?? 1) * 100 < s.metaRetencao)
    alerts.push({
      tone: "warning",
      title: `Menor retenção regional: ${worstRegion.label} (${fmtPct(worstRegion.retention)})`,
      desc: `Base de ${worstRegion.base} alunos. Diferenças regionais não indicam, sozinhas, a causa da desistência.`,
      to: "/admin/regional",
    })
  const dem = demand(ctx, ctx.range, m.regions.groupOf)
  const waiting = dem.rows.slice().sort((a, b) => b.espera - a.espera)[0]
  if (waiting && waiting.espera > 0)
    alerts.push({
      tone: "warning",
      title: `Demanda não atendida: ${waiting.label}`,
      desc: `${waiting.espera} pessoa(s) em lista de espera de ${waiting.total} solicitações no período.`,
      to: "/admin/regional",
    })
  if (sat.responseRate !== null && sat.responseRate * 100 < s.metaResposta)
    alerts.push({
      tone: "warning",
      title: `Cobertura de avaliações em ${fmtPct(sat.responseRate)}`,
      desc: `Abaixo da meta de ${s.metaResposta}%: as médias podem não representar todos os participantes.`,
      to: "/admin/experiencias",
    })
  const lowDim = m.dims
    .filter((d) => d.mean !== null)
    .sort((a, b) => (a.mean ?? 5) - (b.mean ?? 5))[0]
  if (lowDim && lowDim.mean !== null && lowDim.mean < s.metaSatisfacao)
    alerts.push({
      tone: "warning",
      title: `Oportunidade de melhoria: ${lowDim.label.toLowerCase()}`,
      desc: `Menor média entre as dimensões (${fmtScore(lowDim.mean)} de 5, n = ${lowDim.n}).`,
      to: "/admin/experiencias",
    })
  if (!alerts.length)
    alerts.push({
      tone: "positive",
      title: "Indicadores dentro das metas configuradas",
      desc: "Nenhum limite de atenção foi ultrapassado no período selecionado.",
      to: "/admin/relatorios",
    })

  const goal = (v: number | null, meta: number, higher = true) =>
    v === null
      ? undefined
      : {
          text: `Meta ${higher ? "≥" : "≤"} ${meta}%`,
          met: higher ? v * 100 >= meta : v * 100 <= meta,
        }

  return (
    <AnalyticsFrame
      ctx={ctx}
      go={go}
      eyebrow="CENTRAL DE GESTÃO"
      title="Visão geral"
      desc="Bem-vindo, Davi. Permanência dos alunos, qualidade das experiências musicais e alcance regional, para decidir com base em dados."
    >
      <div className="kpi-grid">
        <KpiCard
          label="Taxa de retenção"
          icon="users"
          status={ret.status}
          need={ret.need}
          value={fmtPct(ret.rate)}
          detail={`${ret.retained} de ${ret.base} alunos ativos no início seguem ativos`}
          delta={{
            current: ret.rate,
            previous: retPrev.rate,
            kind: "rate",
            better: "up",
          }}
          goal={goal(ret.rate, s.metaRetencao)}
          trend={m.trend.map((t) => t.ret)}
          formula="(alunos ativos no início do período que continuam ativos no fim ÷ alunos ativos no início) × 100. Ingressos do período não entram na base."
          unit="percentual de alunos"
          period={period}
          onOpen={() => go("/admin/retencao")}
        />
        <KpiCard
          label="Desistências"
          icon="logout"
          status={drop.status}
          need={drop.need}
          value={fmtNum(drop.count)}
          detail={`${fmtPct(drop.rate)} da base inicial${
            drop.newcomers
              ? ` · ${drop.newcomers} saída(s) de recém-ingressos contadas à parte`
              : ""
          }`}
          delta={{
            current: drop.count,
            previous: dropPrev.count,
            kind: "count",
            better: "down",
          }}
          trend={m.trend.map((t) => t.drop)}
          formula="Quantidade de alunos da base inicial com desligamento efetivado no período. Taxa = desistências ÷ alunos ativos no início."
          unit="alunos (quantidade) e percentual da base"
          period={period}
          onOpen={() => go("/admin/retencao")}
        />
        <KpiCard
          label="Taxa de presença"
          icon="check"
          status={pres.status}
          need={pres.need}
          value={fmtPct(pres.rate)}
          detail={`${fmtNum(pres.present)} de ${fmtNum(pres.expected)} participações previstas`}
          delta={{
            current: pres.rate,
            previous: presPrev.rate,
            kind: "rate",
            better: "up",
          }}
          goal={goal(pres.rate, s.metaPresenca)}
          trend={m.trend.map((t) => t.pres)}
          formula="(participações realizadas ÷ participações previstas em encontros efetivamente ofertados) × 100. Encontros cancelados não contam como falta."
          unit="percentual de participações"
          period={period}
          onOpen={() => go("/admin/ocorrencias")}
        />
        <KpiCard
          label="Experiências canceladas"
          icon="calendar"
          status={canc.status}
          need={canc.need}
          value={fmtNum(canc.cancelled)}
          detail={`${fmtPct(canc.rate)} de ${fmtNum(canc.scheduled)} encontros · aluno ${canc.bySide.aluno} · professor ${canc.bySide.professor} · escola ${canc.bySide.escola}${
            canc.bySide.nao_informado
              ? ` · sem origem ${canc.bySide.nao_informado}`
              : ""
          }`}
          delta={{
            current: canc.rate,
            previous: cancPrev.rate,
            kind: "rate",
            better: "down",
          }}
          goal={goal(canc.rate, s.limiteCancelamento, false)}
          trend={m.trend.map((t) => t.canc)}
          formula="Encontros programados cancelados ÷ encontros programados (realizados + cancelados), separados por responsável: aluno, professor ou escola."
          unit="encontros (quantidade) e percentual"
          period={period}
          onOpen={() => go("/admin/ocorrencias")}
        />
        <KpiCard
          label="Satisfação das experiências"
          icon="star"
          status={sat.status}
          need={sat.need}
          value={`${fmtScore(sat.mean)} / 5`}
          detail={`n = ${fmtNum(sat.n)} respostas · taxa de resposta ${fmtPct(sat.responseRate)}`}
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
                  text: `Meta ≥ ${String(s.metaSatisfacao).replace(".", ",")}`,
                  met: sat.mean >= s.metaSatisfacao,
                }
          }
          trend={m.trend.map((t) => t.sat)}
          formula="Média das avaliações válidas (1 a 5) nas cinco dimensões. Taxa de resposta = avaliações de alunos e responsáveis ÷ participações realizadas."
          unit="nota média de 1 a 5"
          period={period}
          onOpen={() => go("/admin/experiencias")}
        />
        <KpiCard
          label="Alunos que precisam de acompanhamento"
          icon="heart"
          status={
            pres.status === "indisponivel"
              ? "indisponivel"
              : ret.status === "indisponivel"
                ? "indisponivel"
                : "ok"
          }
          need={pres.need || ret.need}
          value={fmtNum(follow.length)}
          detail={`${attention} em atenção · ${follow.length - attention} para acompanhar · revisão humana obrigatória`}
          delta={{
            current: follow.length,
            previous: followPrev.length,
            kind: "count",
            better: "down",
          }}
          formula={`Alunos ativos com ao menos ${s.minPrevistas} encontros previstos e presença abaixo de ${s.limiteAtencao}% ou ${s.faltasNaoJustificadas}+ faltas sem justificativa. “Atenção” abaixo de ${s.limiteCritico}%. Critérios configuráveis.`}
          unit="alunos"
          period={period}
          onOpen={() => go("/admin/ocorrencias")}
        />
      </div>

      <div className="dash-grid-2 dash-grid-2--wide">
        <Panel>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PRIORIDADES DO PERÍODO</p>
              <h2>Alertas consolidados</h2>
            </div>
            <Pill tone={alerts[0].tone === "positive" ? "positive" : "warning"}>
              {alerts[0].tone === "positive"
                ? "Tudo em dia"
                : `${alerts.length} ponto(s) de atenção`}
            </Pill>
          </div>
          <div className="alert-list">
            {alerts.map((a) => (
              <button
                key={a.title}
                type="button"
                className={`alert-item alert-item--${a.tone}`}
                onClick={() => go(a.to)}
              >
                <span className="alert-icon">
                  <Icon
                    name={a.tone === "positive" ? "check" : "alert"}
                    size={17}
                  />
                </span>
                <span>
                  <strong>{a.title}</strong>
                  <p>{a.desc}</p>
                </span>
                <Icon name="arrow" size={16} />
              </button>
            ))}
          </div>
          <p className="tiny-note" style={{ marginTop: 14 }}>
            Limites e metas definidos em{" "}
            <b>Dados e importação → Metas e limites</b>. Valores atuais são
            padrões desta demonstração, não regras oficiais.
          </p>
        </Panel>
        <Panel>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">OPERAÇÃO</p>
              <h2>Precisa de você</h2>
            </div>
            <Pill tone={pending ? "warning" : "positive"}>
              {pending} pendente(s)
            </Pill>
          </div>
          <div className="alert-list">
            {[
              [
                "Solicitações de participação",
                "Confirme ou recuse pedidos de novas experiências.",
                "inbox",
                "/admin/solicitacoes",
              ],
              [
                "Novos professores",
                "Avalie os perfis que desejam participar da Lira.",
                "user",
                "/admin/professores",
              ],
              [
                "Agenda geral",
                "Próximos encontros programados.",
                "calendar",
                "/admin/agenda",
              ],
              [
                "Relatórios",
                "Gere e exporte visões detalhadas com os filtros atuais.",
                "chart",
                "/admin/relatorios",
              ],
            ].map(([t, d, i, p]) => (
              <button
                key={t}
                type="button"
                className="alert-item"
                onClick={() => go(p)}
              >
                <span className="alert-icon alert-icon--brand">
                  <Icon name={i} size={17} />
                </span>
                <span>
                  <strong>{t}</strong>
                  <p>{d}</p>
                </span>
                <Icon name="arrow" size={16} />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="dash-grid-2">
        <ChartCard
          eyebrow="RETENÇÃO E PRESENÇA"
          title="Tendência no período"
          desc="Retenção e presença por intervalo, comparadas às metas configuradas."
          meta={[
            "Unidade: %",
            `Base inicial: ${ret.base} alunos`,
            `${fmtNum(pres.expected)} participações`,
          ]}
          legend={[
            { label: "Retenção", color: SERIES[0] },
            { label: "Presença", color: SERIES[1] },
          ]}
          status={
            ret.status === "ok" || pres.status === "ok" ? "ok" : ret.status
          }
          need={ret.need}
        >
          <LineChart
            ariaLabel="Retenção e presença ao longo do período"
            labels={m.trend.map((t) => t.label)}
            series={[
              {
                label: "Retenção",
                color: SERIES[0],
                values: m.trend.map((t) => t.ret),
              },
              {
                label: "Presença",
                color: SERIES[1],
                values: m.trend.map((t) => t.pres),
                n: m.trend.map((t) => t.presN),
              },
            ]}
            min={0.4}
            max={1}
            format={(v) => fmtPct(v, 0)}
            goal={{
              value: s.metaRetencao / 100,
              label: `Meta retenção ${s.metaRetencao}%`,
            }}
          />
        </ChartCard>
        <ChartCard
          eyebrow="QUALIDADE"
          title="Satisfação ao longo do período"
          desc="Média de 1 a 5 das avaliações válidas, com o número de respostas de cada intervalo."
          meta={["Unidade: nota 1–5", `n = ${fmtNum(sat.n)} respostas`]}
          status={sat.status}
          need={sat.need}
        >
          <LineChart
            ariaLabel="Satisfação média ao longo do período"
            labels={m.trend.map((t) => t.label)}
            series={[
              {
                label: "Satisfação média",
                color: SERIES[3],
                values: m.trend.map((t) => (t.satN ? t.sat : null)),
                n: m.trend.map((t) => t.satN),
              },
            ]}
            min={1}
            max={5}
            format={(v) => fmtScore(v).replace(",00", "")}
            goal={{
              value: s.metaSatisfacao,
              label: `Meta ${String(s.metaSatisfacao).replace(".", ",")}`,
            }}
          />
        </ChartCard>
      </div>
    </AnalyticsFrame>
  )
}

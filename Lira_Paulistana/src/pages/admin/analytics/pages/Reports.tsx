import { useState } from "react"
import { Icon, Panel, Pill, PrimaryButton } from "../../../../components/UI"
import type { Go } from "../../../../data/mock"
import { downloadCSV } from "../csv"
import { iso, nowStamp } from "../dates"
import {
  byTeacher,
  cancelReasons,
  cancellations,
  cohorts,
  demand,
  dimensions,
  dropoutReasons,
  dropouts,
  followList,
  fmtNum,
  fmtPct,
  fmtScore,
  getCtx,
  INGRESSO_LABEL,
  presence,
  rangeLabel,
  regions,
  retention,
  satisfaction,
  SITUACAO_LABEL,
  type Ctx,
  type Status,
} from "../metrics"
import { useAnalytics } from "../store"
import { SIDE_LABEL, type Settings } from "../types"
import { AnalyticsFrame } from "../widgets"

type Cell = string | number
type Section = {
  title: string
  columns: string[]
  rows: Cell[][]
  status?: Status
  need?: string
}
type Report = {
  id: string
  title: string
  desc: string
  sections: Section[]
  formulas: string[]
  records: number
}

const show = (status: Status, v: string) =>
  status === "ok"
    ? v
    : status === "indisponivel"
      ? "Não disponível"
      : "Dados insuficientes"

function build(id: string, ctx: Ctx, s: Settings): Report {
  const r = ctx.range
  const p = ctx.prev
  if (id === "qualidade") {
    const sat = satisfaction(ctx, r)
    const satP = satisfaction(ctx, p)
    const teachers = byTeacher(ctx, r, s)
    return {
      id,
      title: "Qualidade das experiências",
      desc: "Satisfação, taxa de resposta, dimensões e professores.",
      records: sat.n,
      formulas: [
        "Satisfação média: média das notas válidas (1 a 5) nas cinco dimensões.",
        "Taxa de resposta: avaliações de alunos e responsáveis ÷ participações realizadas.",
        `Amostra pequena: menos de ${s.amostraMinima} avaliações no período.`,
      ],
      sections: [
        {
          title: "Indicadores",
          status: sat.status,
          need: sat.need,
          columns: [
            "Indicador",
            "Período atual",
            "Período anterior",
            "Amostra",
          ],
          rows: [
            [
              "Satisfação média (1–5)",
              show(sat.status, fmtScore(sat.mean)),
              show(satP.status, fmtScore(satP.mean)),
              `n = ${sat.n}`,
            ],
            [
              "Taxa de resposta",
              fmtPct(sat.responseRate),
              fmtPct(satP.responseRate),
              `${sat.answers} respostas`,
            ],
          ],
        },
        {
          title: "Média por dimensão",
          status: sat.status,
          need: sat.need,
          columns: ["Dimensão", "Média", "Respostas"],
          rows: dimensions(ctx, r).map((d) => [
            d.label,
            d.mean === null ? "Dados insuficientes" : fmtScore(d.mean),
            d.n,
          ]),
        },
        {
          title: "Por professor",
          status: sat.status,
          need: sat.need,
          columns: [
            "Professor",
            "Modalidades",
            "Nota média",
            "Avaliações",
            "Taxa de resposta",
            "Presença",
            "Observação",
          ],
          rows: teachers.map((t) => [
            t.professor,
            t.modalidades.join(", "),
            t.mean === null ? "Dados insuficientes" : fmtScore(t.mean),
            t.n,
            fmtPct(t.responseRate),
            fmtPct(t.presence),
            t.small ? "Amostra pequena" : "",
          ]),
        },
      ],
    }
  }
  if (id === "regional") {
    const reg = regions(ctx, r, s)
    const dem = demand(ctx, r, reg.groupOf)
    return {
      id,
      title: "Análise regional",
      desc: "Alunos, retenção, presença e procura por região agregada.",
      records: reg.rows.reduce((a, x) => a + x.active, 0),
      formulas: [
        "Alunos ativos: ingresso até o fim do período e sem desligamento até essa data.",
        "Retenção regional: alunos da região ativos no início que seguem ativos no fim ÷ alunos da região ativos no início.",
        `Regiões com menos de ${s.minRegiao} alunos são agrupadas para preservar a privacidade.`,
      ],
      sections: [
        {
          title: "Alunos e retenção por região",
          status: reg.status,
          need: reg.need,
          columns: [
            "Região",
            "Alunos ativos",
            "Base inicial",
            "Retenção",
            "Presença",
          ],
          rows: reg.rows.map((x) => [
            x.label,
            x.active,
            x.base,
            x.base ? fmtPct(x.retention) : "Dados insuficientes",
            fmtPct(x.presence),
          ]),
        },
        {
          title: "Procura por região",
          status: dem.status,
          need: dem.need,
          columns: [
            "Região",
            "Solicitações",
            "Atendidas",
            "Lista de espera",
            "Não atendidas",
          ],
          rows: dem.rows.map((x) => [
            x.label,
            x.total,
            x.atendido,
            x.espera,
            x.naoAtendido,
          ]),
        },
      ],
    }
  }
  if (id === "ocorrencias") {
    const pr = presence(ctx, r)
    const c = cancellations(ctx, r)
    const follow = followList(ctx, r, s)
    return {
      id,
      title: "Ocorrências e acompanhamento",
      desc: "Faltas, cancelamentos por responsável, motivos e alunos sinalizados.",
      records: pr.expected + c.scheduled,
      formulas: [
        "Falta: ausência do aluno em encontro realizado. Encontros cancelados não contam como falta.",
        "Cancelamentos são separados por responsável: aluno, professor ou escola.",
        `Acompanhamento: ≥ ${s.minPrevistas} encontros previstos e presença < ${s.limiteAtencao}% ou ≥ ${s.faltasNaoJustificadas} faltas sem justificativa. Sinal para revisão humana.`,
      ],
      sections: [
        {
          title: "Resumo",
          status: c.status === "ok" || pr.status === "ok" ? "ok" : c.status,
          need: c.need,
          columns: ["Ocorrência", "Quantidade", "Proporção"],
          rows: [
            [
              "Faltas do aluno",
              show(pr.status, fmtNum(pr.absent)),
              fmtPct(pr.expected ? pr.absent / pr.expected : null),
            ],
            ...(["aluno", "professor", "escola", "nao_informado"] as const).map(
              (k) => [
                `Cancelamentos ${SIDE_LABEL[k].toLowerCase()}`,
                show(c.status, fmtNum(c.bySide[k])),
                fmtPct(c.scheduled ? c.bySide[k] / c.scheduled : null),
              ],
            ),
          ],
        },
        {
          title: "Motivos de cancelamento",
          status: c.status,
          need: c.need,
          columns: [
            "Motivo",
            "Exemplo de registro",
            "Quantidade",
            "Participação",
          ],
          rows: cancelReasons(ctx, r).map((x) => [
            x.label,
            x.example,
            x.value,
            fmtPct(x.share),
          ]),
        },
        {
          title: "Alunos sinalizados para acompanhamento",
          status: pr.status,
          need: pr.need,
          columns: [
            "Aluno",
            "Sinal",
            "Indicador observado",
            "Professor",
            "Região",
          ],
          rows: follow.map((f) => [
            f.id,
            f.level,
            f.signal,
            f.professor,
            f.regiao,
          ]),
        },
      ],
    }
  }
  const ret = retention(ctx, r)
  const retP = retention(ctx, p)
  const drop = dropouts(ctx, r)
  const dropP = dropouts(ctx, p)
  const co = cohorts(ctx)
  return {
    id: "retencao",
    title: "Retenção e desistências",
    desc: "Retenção, desistências, motivos e coortes de ingresso.",
    records: ret.base,
    formulas: [
      "Retenção: alunos ativos no início do período que continuam ativos no fim ÷ alunos ativos no início. Ingressos do período não entram na base.",
      "Desistências: alunos da base inicial com desligamento efetivado no período.",
      "Coorte: alunos que ingressaram no mesmo mês; cada coluna mostra o percentual ainda ativo após N meses.",
    ],
    sections: [
      {
        title: "Indicadores",
        status: ret.status,
        need: ret.need,
        columns: ["Indicador", "Período atual", "Período anterior", "Base"],
        rows: [
          [
            "Taxa de retenção",
            show(ret.status, fmtPct(ret.rate)),
            show(retP.status, fmtPct(retP.rate)),
            `${ret.base} alunos`,
          ],
          [
            "Desistências",
            show(drop.status, fmtNum(drop.count)),
            show(dropP.status, fmtNum(dropP.count)),
            `${fmtPct(drop.rate)} da base`,
          ],
          [
            "Saídas de recém-ingressos",
            fmtNum(drop.newcomers),
            fmtNum(dropP.newcomers),
            "Contadas à parte",
          ],
        ],
      },
      {
        title: "Motivos de desistência",
        status: ctx.has("desistencias") ? "ok" : "indisponivel",
        need: "desistencias.csv",
        columns: ["Motivo", "Exemplo declarado", "Quantidade", "Participação"],
        rows: dropoutReasons(ctx, r).map((x) => [
          x.label,
          x.example,
          x.value,
          fmtPct(x.share),
        ]),
      },
      {
        title: "Coortes de ingresso (% ainda ativos)",
        status: co.status,
        need: co.need,
        columns: [
          "Ingresso",
          "Alunos",
          ...Array.from({ length: 6 }, (_, k) => `${k + 1}º mês`),
        ],
        rows: co.rows.map((x) => [
          x.label,
          x.size,
          ...x.cells.slice(0, 6).map((c) => (c === null ? "—" : fmtPct(c, 0))),
        ]),
      },
    ],
  }
}

const REPORTS: [string, string, string][] = [
  ["retencao", "Retenção e desistências", "Base, saídas, motivos e coortes"],
  [
    "qualidade",
    "Qualidade das experiências",
    "Satisfação, dimensões e professores",
  ],
  ["regional", "Análise regional", "Alunos, retenção e procura"],
  ["ocorrencias", "Ocorrências", "Faltas, cancelamentos e acompanhamento"],
]

export default function Reports({
  go,
  exportOperational,
}: {
  go: Go
  exportOperational: () => void
}) {
  const { dataset, filters: f, settings } = useAnalytics()
  const ctx = getCtx(dataset, f)
  const [id, setId] = useState("retencao")
  const report = build(id, ctx, settings)
  const generated = nowStamp()
  const filterText =
    [
      f.regiao && `Região: ${f.regiao}`,
      f.professor && `Professor: ${f.professor}`,
      f.modalidade && `Modalidade: ${f.modalidade}`,
      f.situacao !== "todos" && SITUACAO_LABEL[f.situacao],
      f.ingresso !== "todas" && INGRESSO_LABEL[f.ingresso],
    ]
      .filter(Boolean)
      .join(" · ") || "Nenhum filtro adicional"
  const missingNotes = report.sections
    .filter((x) => x.status && x.status !== "ok")
    .map(
      (x) =>
        `${x.title}: ${
          x.status === "indisponivel"
            ? `não disponível (requer ${x.need})`
            : "dados insuficientes no período"
        }`,
    )
  const meta: [string, string][] = [
    ["Relatório", report.title],
    ["Período", rangeLabel(ctx.range)],
    ["Comparação", rangeLabel(ctx.prev)],
    ["Gerado em", generated],
    [
      "Fonte",
      dataset.origin === "demo"
        ? "Dados de demonstração (simulados)"
        : `Dados importados: ${dataset.available.map((k) => `${k}.csv`).join(", ")}`,
    ],
    ["Filtros", filterText],
    ["Registros considerados", fmtNum(report.records)],
  ]

  const exportCSV = () => {
    const rows: Cell[][] = [
      ...meta.map(([k, v]) => [k, v]),
      ["Dados ausentes", missingNotes.join(" | ") || "Nenhum"],
      [],
    ]
    for (const sec of report.sections) {
      rows.push([sec.title])
      if (sec.status && sec.status !== "ok")
        rows.push([
          sec.status === "indisponivel"
            ? `Não disponível — requer ${sec.need}`
            : "Dados insuficientes",
        ])
      else rows.push(sec.columns, ...sec.rows)
      rows.push([])
    }
    rows.push(["Fórmulas"], ...report.formulas.map((x) => [x]))
    downloadCSV(
      `lira-${report.id}-${iso(ctx.range.start)}-a-${iso(ctx.range.end)}.csv`,
      rows,
    )
  }

  return (
    <AnalyticsFrame
      ctx={ctx}
      go={go}
      eyebrow="VISÃO DE CONJUNTO"
      title="Relatórios"
      desc="Relatórios detalhados com os mesmos filtros da dashboard. Exporte em CSV ou imprima / salve em PDF."
      right={
        <button
          type="button"
          className="ghost-button"
          onClick={exportOperational}
        >
          <Icon name="download" size={15} /> Solicitações (CSV)
        </button>
      }
    >
      <div
        className="report-picker"
        role="group"
        aria-label="Tipo de relatório"
      >
        {REPORTS.map(([rid, t, d]) => (
          <button
            key={rid}
            type="button"
            className={`report-option ${id === rid ? "is-active" : ""}`}
            aria-pressed={id === rid}
            onClick={() => setId(rid)}
          >
            <strong>{t}</strong>
            <span>{d}</span>
          </button>
        ))}
      </div>

      <Panel>
        <div className="report-document">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LIRA PAULISTANA · RELATÓRIO</p>
              <h2>{report.title}</h2>
            </div>
            <div className="inline-actions no-print">
              <button
                type="button"
                className="ghost-button"
                onClick={() => window.print()}
              >
                <Icon name="printer" size={15} /> Imprimir / PDF
              </button>
              <PrimaryButton onClick={exportCSV}>
                Exportar CSV <Icon name="download" size={17} />
              </PrimaryButton>
            </div>
          </div>
          <div className="report-meta">
            {meta.map(([k, v]) => (
              <span key={k}>
                <b>{k}</b>
                {v}
              </span>
            ))}
          </div>
          {dataset.origin === "demo" && (
            <p className="filter-warning">
              <Icon name="alert" size={15} /> Relatório gerado com dados de
              demonstração: não representa alunos reais.
            </p>
          )}
          {report.sections.map((sec) => (
            <section className="report-section" key={sec.title}>
              <h3>{sec.title}</h3>
              {sec.status && sec.status !== "ok" ? (
                <p className="tiny-note">
                  <Pill tone="warning">
                    {sec.status === "indisponivel"
                      ? "Não disponível"
                      : "Dados insuficientes"}
                  </Pill>{" "}
                  {sec.status === "indisponivel"
                    ? `Requer ${sec.need}.`
                    : "Sem registros no período e filtros selecionados."}
                </p>
              ) : sec.rows.length === 0 ? (
                <p className="tiny-note">
                  Nenhum registro no período e filtros selecionados.
                </p>
              ) : (
                <div className="simple-table-wrap">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        {sec.columns.map((c) => (
                          <th key={c} scope="col">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((c, k) => (
                            <td key={k}>{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
          <section className="report-section">
            <h3>Fórmulas e observações</h3>
            <ul className="report-formulas">
              {report.formulas.map((x) => (
                <li key={x}>{x}</li>
              ))}
              <li>
                Dados ausentes:{" "}
                {missingNotes.join("; ") ||
                  "nenhum indicador deste relatório depende de arquivos ausentes."}
              </li>
              <li>
                Ausência de dados é indicada como “Não disponível” ou “Dados
                insuficientes”, nunca como zero.
              </li>
            </ul>
          </section>
        </div>
      </Panel>
      <button
        type="button"
        className="card-link"
        onClick={() => go("/admin/uso-do-site")}
      >
        Métricas de uso do site (navegação, separadas das pedagógicas){" "}
        <Icon name="arrow" size={15} />
      </button>
    </AnalyticsFrame>
  )
}

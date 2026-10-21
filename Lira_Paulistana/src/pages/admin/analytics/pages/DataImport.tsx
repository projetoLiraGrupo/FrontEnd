import { useRef, useState, type DragEvent } from "react"
import {
  Icon,
  PageIntro,
  Panel,
  Pill,
  PrimaryButton,
} from "../../../../components/UI"
import {
  buildDataset,
  downloadText,
  FILE_KINDS,
  readFile,
  SCHEMAS,
  templateCSV,
  type ImportReport,
} from "../csv"
import { fmtDay, today } from "../dates"
import { fmtNum } from "../metrics"
import { actions, DEFAULT_SETTINGS, useAnalytics } from "../store"
import type { Dataset, FileKind, Settings } from "../types"
import "../analytics.css"

/** Raw text of staged files, kept so a file can be re-validated after manual mapping. */
const sources = new Map<string, string>()

async function decode(file: File) {
  const buf = await file.arrayBuffer()
  const utf8 = new TextDecoder("utf-8").decode(buf)
  // Spreadsheet exports often use Windows-1252; fall back when UTF-8 decoding produced replacement chars.
  return utf8.includes("\ufffd")
    ? new TextDecoder("windows-1252").decode(buf)
    : utf8
}

/** Reference day = last date present in the imported records (never in the future). */
function refDayOf(ds: Dataset) {
  const days = [
    ...ds.encontros.filter((e) => e.status !== "prevista").map((e) => e.data),
    ...ds.avaliacoes.map((a) => a.data),
    ...ds.desistencias.map((d) => d.data),
    ...ds.alunos.map((a) => a.saida ?? a.ingresso),
    ...ds.interesses.map((i) => i.data),
    ...ds.navegacao.map((n) => n.day),
  ]
  const max = days.length ? days.reduce((a, b) => (b > a ? b : a)) : today()
  return Math.min(today(), max)
}

const SETTING_FIELDS: {
  key: keyof Settings
  label: string
  help: string
  step?: number
}[] = [
  {
    key: "metaRetencao",
    label: "Meta de retenção (%)",
    help: "Mínimo desejado de alunos da base que permanecem.",
  },
  {
    key: "metaPresenca",
    label: "Meta de presença (%)",
    help: "Participações realizadas ÷ previstas.",
  },
  {
    key: "limiteCancelamento",
    label: "Limite de cancelamentos (%)",
    help: "Acima disso, gera alerta na visão geral.",
  },
  {
    key: "metaSatisfacao",
    label: "Meta de satisfação (1–5)",
    help: "Média mínima desejada.",
    step: 0.1,
  },
  {
    key: "metaResposta",
    label: "Meta de taxa de resposta (%)",
    help: "Cobertura mínima das avaliações.",
  },
  {
    key: "amostraMinima",
    label: "Amostra mínima (avaliações)",
    help: "Abaixo disso, médias são marcadas como amostra pequena.",
  },
  {
    key: "limiteAtencao",
    label: "Presença para acompanhamento (%)",
    help: "Abaixo disso o aluno é sinalizado para acompanhar.",
  },
  {
    key: "limiteCritico",
    label: "Presença para atenção (%)",
    help: "Abaixo disso o sinal passa a “Atenção”.",
  },
  {
    key: "minPrevistas",
    label: "Encontros previstos mínimos",
    help: "Evita sinalizar alunos com poucos registros.",
  },
  {
    key: "faltasNaoJustificadas",
    label: "Faltas sem justificativa",
    help: "Quantidade que também gera sinalização.",
  },
  {
    key: "minRegiao",
    label: "Alunos mínimos por região",
    help: "Regiões menores são agrupadas por privacidade.",
  },
]

export default function DataImport() {
  const { dataset, staged, settings } = useAnalytics()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{
    integrity: string[]
    files: number
  } | null>(null)

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setResult(null)
    const next = staged.filter(
      (r) => ![...files].some((f) => f.name === r.fileName),
    )
    for (const file of [...files]) {
      const text = await decode(file)
      sources.set(file.name, text)
      next.push(readFile(file.name, text))
    }
    actions.setStaged(next)
    setBusy(false)
  }
  const remap = (name: string, kind: FileKind | null) => {
    const text = sources.get(name)
    if (text === undefined) return
    actions.setStaged(
      staged.map((r) => (r.fileName === name ? readFile(name, text, kind) : r)),
    )
  }
  const remove = (name: string) => {
    sources.delete(name)
    actions.setStaged(staged.filter((r) => r.fileName !== name))
  }
  const apply = () => {
    const { dataset: ds, integrity } = buildDataset(staged, today())
    ds.refDay = refDayOf(ds)
    actions.loadImported(ds)
    setResult({ integrity, files: staged.filter((r) => r.valid > 0).length })
    sources.clear()
    actions.setStaged([])
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    void addFiles(e.dataTransfer.files)
  }
  const usable = staged.filter((r) => r.kind && r.valid > 0)
  const duplicateKinds = FILE_KINDS.filter(
    (k) => staged.filter((r) => r.kind === k).length > 1,
  )
  const counts: [string, number][] = [
    ["alunos", dataset.alunos.length],
    ["experiencias", dataset.encontros.length],
    ["participacoes", dataset.participacoes.length],
    ["avaliacoes", dataset.avaliacoes.length],
    ["desistencias", dataset.desistencias.length],
    ["interesses", dataset.interesses.length],
    ["navegacao", dataset.navegacao.length],
  ]

  return (
    <>
      <PageIntro
        eyebrow="CONFIGURAÇÃO"
        title="Dados e importação"
        desc="Importe as planilhas da escola em CSV. O processamento acontece somente neste navegador: nenhum dado é enviado pela rede."
      />
      <div className="dash-stack">
        <div
          className={`source-banner ${
            dataset.origin === "demo" ? "source-banner--demo" : ""
          }`}
          role="status"
        >
          <Icon
            name={dataset.origin === "demo" ? "alert" : "database"}
            size={18}
          />
          <p>
            <strong>
              {dataset.origin === "demo"
                ? "Em uso: dados de demonstração."
                : "Em uso: dados importados."}
            </strong>{" "}
            {dataset.origin === "demo"
              ? "Os indicadores mostram uma base simulada. Importe seus arquivos para substituí-la por completo."
              : `Carregados em ${fmtDay(Math.floor(Date.parse(dataset.loadedAt) / 86400000))} · data de referência ${fmtDay(dataset.refDay)}. Mantidos apenas nesta sessão do navegador.`}
          </p>
          {dataset.origin === "importado" && (
            <button
              type="button"
              className="card-link"
              onClick={() => actions.loadDemo()}
            >
              Voltar à demonstração <Icon name="reset" size={15} />
            </button>
          )}
        </div>

        {result && (
          <div className="alert-item alert-item--positive" role="status">
            <span className="alert-icon">
              <Icon name="check" size={17} />
            </span>
            <span>
              <strong>
                Importação aplicada: {result.files} arquivo(s). Todas as
                visualizações foram recalculadas.
              </strong>
              {result.integrity.map((m) => (
                <p key={m}>{m}</p>
              ))}
            </span>
          </div>
        )}

        <Panel>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">IMPORTAR CSV</p>
              <h2>Arquivos da escola</h2>
            </div>
            <Pill>{staged.length} arquivo(s) em análise</Pill>
          </div>
          <label
            className={`dropzone ${over ? "is-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <Icon name="upload" size={28} />
            <strong>
              {busy
                ? "Lendo arquivos…"
                : "Arraste os CSVs aqui ou clique para selecionar"}
            </strong>
            <p>
              Um ou vários arquivos de uma vez. O tipo é reconhecido pelo nome
              do arquivo ou pelas colunas; separador vírgula ou ponto e vírgula;
              datas em AAAA-MM-DD ou DD/MM/AAAA.
            </p>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={(e) => {
                void addFiles(e.target.files)
                e.target.value = ""
              }}
            />
          </label>

          {staged.length > 0 && (
            <div className="dash-stack" style={{ marginTop: 18 }}>
              {staged.map((r) => (
                <FileReport
                  key={r.fileName}
                  r={r}
                  onKind={(k) => remap(r.fileName, k)}
                  onRemove={() => remove(r.fileName)}
                />
              ))}
              {duplicateKinds.length > 0 && (
                <p className="filter-warning">
                  <Icon name="alert" size={15} /> Mais de um arquivo do tipo{" "}
                  {duplicateKinds.map((k) => SCHEMAS[k].file).join(", ")}: os
                  registros serão combinados.
                </p>
              )}
              <div className="inline-actions">
                <PrimaryButton onClick={apply} disabled={!usable.length}>
                  Aplicar importação (
                  {fmtNum(usable.reduce((a, r) => a + r.valid, 0))} linhas
                  válidas) <Icon name="check" size={17} />
                </PrimaryButton>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    sources.clear()
                    actions.setStaged([])
                  }}
                >
                  Descartar arquivos
                </button>
                <span className="tiny-note">
                  A importação substitui por completo a base em uso. Indicadores
                  que dependem de arquivos não enviados aparecem como “Não
                  disponível”.
                </span>
              </div>
            </div>
          )}
        </Panel>

        <div className="dash-grid-2 dash-grid-2--wide">
          <Panel>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">ESTRUTURA ESPERADA</p>
                <h2>Arquivos e colunas</h2>
              </div>
            </div>
            <div className="schema-list">
              {FILE_KINDS.map((k) => {
                const s = SCHEMAS[k]
                const n = counts.find(([c]) => c === k)?.[1] ?? 0
                return (
                  <div className="schema-row" key={k}>
                    <div>
                      <strong>{s.file}</strong>
                      <br />
                      {dataset.available.includes(k) ? (
                        <Pill tone="positive">{fmtNum(n)} registros</Pill>
                      ) : (
                        <Pill tone="warning">Não carregado</Pill>
                      )}
                    </div>
                    <div>
                      <span className="mono">{s.required.join(", ")}</span>
                      {s.optional.length > 0 && (
                        <span className="mono">
                          {" "}
                          · opcionais: {s.optional.join(", ")}
                        </span>
                      )}
                      <br />
                      Alimenta: {s.feeds} · origem: {s.origin}
                      {k === "navegacao" &&
                        " · métricas de uso do site, separadas das pedagógicas"}
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        downloadText(
                          s.file,
                          "\ufeff" + templateCSV(k),
                          "text/csv;charset=utf-8",
                        )
                      }
                    >
                      <Icon name="download" size={15} /> Modelo
                    </button>
                  </div>
                )
              })}
            </div>
          </Panel>
          <Panel>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">METAS E LIMITES</p>
                <h2>Critérios da dashboard</h2>
              </div>
              <button
                type="button"
                className="card-link"
                onClick={actions.resetSettings}
              >
                Restaurar padrões <Icon name="reset" size={15} />
              </button>
            </div>
            <p className="tiny-note" style={{ marginBottom: 14 }}>
              Valores iniciais são sugestões desta demonstração, não regras
              oficiais. Ficam salvos neste navegador e são aplicados a alertas,
              metas e sinalizações.
            </p>
            <div
              className="settings-grid"
              style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}
            >
              {SETTING_FIELDS.map((f) => (
                <label className="filter-field" key={f.key}>
                  <span>{f.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={f.key === "metaSatisfacao" ? 5 : undefined}
                    step={f.step ?? 1}
                    value={settings[f.key]}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      if (e.target.value !== "" && Number.isFinite(v) && v >= 0)
                        actions.setSettings({ [f.key]: v })
                    }}
                  />
                  <small>
                    {f.help} Padrão:{" "}
                    {String(DEFAULT_SETTINGS[f.key]).replace(".", ",")}.
                  </small>
                </label>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

function FileReport({
  r,
  onKind,
  onRemove,
}: {
  r: ImportReport
  onKind: (k: FileKind | null) => void
  onRemove: () => void
}) {
  const schema = r.kind ? SCHEMAS[r.kind] : null
  const discarded = Object.values(r.discarded).reduce((a, b) => a + b, 0)
  const ok = r.kind && !r.missingColumns.length && r.valid > 0
  return (
    <div className="file-report">
      <div className="file-report-head">
        <Icon name={ok ? "check" : "alert"} size={18} />
        <strong>{r.fileName}</strong>
        <label className="sr-only" htmlFor={`kind-${r.fileName}`}>
          Tipo do arquivo {r.fileName}
        </label>
        <select
          id={`kind-${r.fileName}`}
          value={r.kind ?? ""}
          onChange={(e) => onKind((e.target.value || null) as FileKind | null)}
        >
          <option value="">Tipo não reconhecido — escolha</option>
          {FILE_KINDS.map((k) => (
            <option key={k} value={k}>
              {SCHEMAS[k].file}
            </option>
          ))}
        </select>
        <div className="file-counts">
          <Pill>{fmtNum(r.total)} linhas</Pill>
          <Pill tone={r.valid ? "positive" : "negative"}>
            {fmtNum(r.valid)} válidas
          </Pill>
          {discarded > 0 && (
            <Pill tone="warning">{fmtNum(discarded)} descartadas</Pill>
          )}
        </div>
        <button
          type="button"
          className="ghost-button"
          style={{ marginLeft: "auto" }}
          onClick={onRemove}
        >
          <Icon name="x" size={14} /> Remover
        </button>
      </div>
      {!r.kind && (
        <p className="filter-warning">
          <Icon name="alert" size={15} /> Não foi possível identificar o arquivo
          pelo nome nem pelas colunas. Selecione o tipo acima.
        </p>
      )}
      {r.missingColumns.length > 0 && (
        <p className="filter-warning">
          <Icon name="alert" size={15} /> Colunas obrigatórias ausentes:{" "}
          <span className="mono">{r.missingColumns.join(", ")}</span>. Nenhuma
          linha foi aproveitada.
        </p>
      )}
      {(discarded > 0 || Object.keys(r.warnings).length > 0) && (
        <ul className="reason-list">
          {Object.entries(r.discarded).map(([k, v]) => (
            <li key={k}>
              Descartadas — {k}: {fmtNum(v)}
            </li>
          ))}
          {Object.entries(r.warnings).map(([k, v]) => (
            <li key={k}>
              Aviso — {k}: {fmtNum(v)}
            </li>
          ))}
        </ul>
      )}
      {r.headers.length > 0 && (
        <details className="chart-data">
          <summary>Pré-visualizar as primeiras linhas</summary>
          <div className="simple-table-wrap">
            <table className="simple-table preview-table">
              <caption className="sr-only">
                Primeiras linhas de {r.fileName}
              </caption>
              <thead>
                <tr>
                  {r.headers.map((h, i) => (
                    <th
                      key={h + i}
                      scope="col"
                      className={
                        schema?.required.includes(h) ? "is-required" : ""
                      }
                    >
                      {h}
                    </th>
                  ))}
                  {r.missingColumns.map((h) => (
                    <th key={`m-${h}`} scope="col" className="is-missing">
                      {h} (ausente)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.preview.map((row, i) => (
                  <tr key={i}>
                    {r.headers.map((_, k) => (
                      <td key={k}>{row[k] ?? ""}</td>
                    ))}
                    {r.missingColumns.map((h) => (
                      <td key={`m-${h}`}>—</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}

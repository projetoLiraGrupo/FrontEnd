import { useState } from 'react'
import { Button, Card, H1, H2, Field, Badge, Table } from './ui'

export type Page =
  | 'home' | 'login' | 'professores' | 'admin' | 'agenda' | 'agendar' | 'verificacoes'
  | 'planejar' | 'conteudos' | 'portal-professor' | 'cadastro-aluno' | 'portal-aluno'
export type Go = (p: Page) => void

function Staff({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div role="img" aria-label={label} className={`relative overflow-hidden rounded-2xl bg-brand ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,#b5562f_0,transparent_45%)] opacity-70" />
      <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-px bg-white/30" />)}
      </div>
      {[18, 34, 52, 70].map((l, i) => (
        <div key={l} className="absolute h-5 w-7 -rotate-12 rounded-[50%] bg-paper" style={{ left: `${l}%`, top: `${38 + (i % 3) * 8}%` }} />
      ))}
      <p className="absolute bottom-4 left-5 text-xs text-white/80">{label}</p>
    </div>
  )
}

/* ---------- Público ---------- */
export function Home({ go }: { go: Go }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Escola de música · Aclimação</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight">Música para aprender, expressar e pertencer.</h1>
          <p className="mt-6 max-w-md text-lg text-muted">Aulas de música para diferentes idades e formas de aprender. Conheça a escola e converse sobre seus objetivos.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => go('cadastro-aluno')}>Cadastrar-me como aluno</Button>
            <Button onClick={() => go('professores')}>Conhecer professores</Button>
          </div>
        </div>
        <Staff label="Aula de música na Escola Lira Paulistana" className="aspect-[4/3]" />
      </section>
      <section className="mt-20" aria-labelledby="formas">
        <h2 id="formas" className="font-display text-2xl font-semibold">Encontre sua forma de aprender</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ['Cursos de música', 'Violão, piano e canto. Opções sujeitas à oferta da escola.'],
            ['Acolhimento e inclusão', 'Converse sobre seus objetivos e preferências de aprendizagem.'],
            ['Sua rotina, organizada', 'Consulte aulas e conteúdos em um único ambiente.'],
          ].map(([t, d], i) => (
            <Card key={t}>
              <span className="font-display text-sm text-accent">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-muted">{d}</p>
            </Card>
          ))}
        </div>
      </section>
      <Card tone="brand" className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <H2>Vamos conversar?</H2>
          <p className="mt-1 text-muted">Rua Topázio, 258 — Aclimação · Escola Lira Paulistana</p>
        </div>
        <Button variant="primary">Contato com a escola</Button>
      </Card>
    </div>
  )
}

export function Login({ go }: { go: Go }) {
  const [show, setShow] = useState(false)
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-14 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-tight">Bem-vindo à sua escola de música.</h1>
        <p className="mt-4 text-lg text-muted">Acompanhe sua agenda, acesse materiais e converse com seus professores.</p>
        <Staff label="Ilustração da escola" className="mt-10 aspect-[2/1]" />
      </div>
      <Card className="p-8">
        <h2 className="font-display text-2xl font-semibold">Acessar minha conta</h2>
        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); go('portal-aluno') }}>
          <Field label="E-mail" type="email" placeholder="voce@exemplo.com" />
          <div>
            <Field label="Senha" type={show ? 'text' : 'password'} placeholder="Digite sua senha" />
            <div className="mt-2 flex justify-end">
              <Button type="button" variant="ghost" aria-pressed={show} onClick={() => setShow(!show)}>{show ? 'Ocultar senha' : 'Mostrar senha'}</Button>
            </div>
          </div>
          <Button variant="primary" className="w-full">Entrar</Button>
          <Button type="button" className="w-full">Esqueci minha senha</Button>
        </form>
        <div className="mt-6 border-t border-line pt-6">
          <p className="font-semibold">Não tem uma conta?</p>
          <p className="text-sm text-muted">Aluno: cadastre-se. Professor: solicite verificação.</p>
          <Button className="mt-4 w-full" onClick={() => go('cadastro-aluno')}>Criar cadastro</Button>
        </div>
        <p className="mt-4 text-xs text-muted">Demonstração: acesse também o <button className="underline" onClick={() => go('portal-professor')}>portal do professor</button> ou o <button className="underline" onClick={() => go('admin')}>portal do administrador</button>.</p>
      </Card>
    </div>
  )
}

export function Professores({ go }: { go: Go }) {
  const list = [
    ['Professor(a) 01', 'Piano • Iniciantes e intermediários • Apoio visual', 'Ensino adaptável ao nível e às preferências de aprendizagem. Proposta de aula ajustada ao aluno.'],
    ['Professor(a) 02', 'Violão • Iniciantes • Aulas estruturadas', 'Rotina previsível e orientação passo a passo. Objetivos definidos conforme o ritmo de aprendizagem.'],
  ]
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <H1 sub="Encontre professores por instrumento, horário e perfil de ensino.">Conheça nossos professores</H1>
      <form className="mt-8 grid items-end gap-4 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(e) => e.preventDefault()}>
        <Field label="Instrumento" options={['Todos os instrumentos', 'Piano', 'Violão', 'Canto']} />
        <Field label="Disponibilidade" options={['Qualquer período', 'Manhã', 'Tarde', 'Noite']} />
        <Field label="Perfil de ensino" options={['Todos os perfis', 'Iniciantes', 'Intermediários']} />
        <Button variant="primary" className="px-8">Buscar</Button>
      </form>
      <div className="mt-10 space-y-5">
        {list.map(([n, tags, d]) => (
          <Card key={n} className="grid gap-6 md:grid-cols-[140px_1fr_240px]">
            <div role="img" aria-label={`Foto de ${n}`} className="grid aspect-[4/5] place-items-center rounded-xl bg-brand-soft font-display text-3xl text-brand">{n.slice(-2)}</div>
            <div>
              <h2 className="font-display text-2xl font-semibold">{n}</h2>
              <p className="mt-2 font-semibold text-brand">{tags}</p>
              <p className="mt-3 text-muted">{d}</p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted">Perfil compatível: iniciante</p>
              <Button>Ver apresentação</Button>
              <Button variant="primary" onClick={() => go('agendar')}>Solicitar aula experimental</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ---------- Administrador ---------- */
export function Admin({ go }: { go: Go }) {
  return (
    <div className="space-y-8">
      <H1 sub="Quarta-feira, 2 de setembro · Resumo do dia">Portal do administrador</H1>
      <div className="grid gap-5 md:grid-cols-3">
        {[['Aulas hoje', '08'], ['Alunos ativos', '48'], ['Professores pendentes', '03']].map(([l, v]) => (
          <Card key={l}><p className="text-muted">{l}</p><p className="mt-2 font-display text-4xl font-semibold">{v}</p></Card>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="primary" onClick={() => go('agendar')}>+ Agendar aula</Button>
        <Button variant="primary" onClick={() => go('cadastro-aluno')}>+ Cadastrar aluno</Button>
        <Button variant="primary" onClick={() => go('verificacoes')}>Verificar professores</Button>
        <Button variant="primary">Montar relatório</Button>
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between"><H2>Aulas de hoje</H2><Button onClick={() => go('agenda')}>Ver agenda completa</Button></div>
        <Table head={['Horário', 'Aluno / turma', 'Professor', 'Instrumento', 'Situação']} rows={[
          ['09:00', 'Aluno 01', 'Professor(a) 01', 'Piano', <Badge>Confirmada</Badge>],
          ['10:00', 'Aluno 02', 'Professor(a) 02', 'Violão', <Badge>Aguardando confirmação</Badge>],
          ['14:00', 'Turma A', 'Professor(a) 03', 'Canto', <Badge>Confirmada</Badge>],
        ]} />
      </section>
      <Card tone="sand" className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="font-semibold">Relatórios da escola</p><p className="text-sm text-muted">Tipo: aulas / alunos / professores • Período: mensal</p></div>
        <Button>Gerar relatório</Button>
      </Card>
    </div>
  )
}

export function Agenda({ go }: { go: Go }) {
  const days = ['SEG 31', 'TER 01', 'QUA 02', 'QUI 03', 'SEX 04']
  const hours = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00']
  const ev: Record<string, [string, string]> = {
    '09:00-0': ['09:00 • Piano', 'Aluno 01 • Confirmada'], '09:00-2': ['09:00 • Piano', 'Aluno 03 • Confirmada'],
    '10:00-1': ['10:00 • Violão', 'Aluno 02 • Pendente'], '11:00-3': ['11:00 • Piano', 'Aluno 04 • Confirmada'],
    '13:00-4': ['13:00 • Violão', 'Aluno 05 • Confirmada'], '14:00-2': ['14:00 • Canto', 'Turma A • Confirmada'],
  }
  const [sel, setSel] = useState<string | null>(null)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><H1>Agenda de aulas</H1><Button variant="primary" onClick={() => go('agendar')}>+ Agendar aula</Button></div>
      <div className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Professor" options={['Todos os professores', 'Professor(a) 01', 'Professor(a) 02', 'Professor(a) 03']} />
        <Field label="Instrumento" options={['Todos', 'Piano', 'Violão', 'Canto']} />
        <div role="group" aria-label="Visualização" className="flex gap-2"><Button variant="primary" aria-pressed>Semana</Button><Button aria-pressed={false}>Lista</Button></div>
      </div>
      <div className="flex items-center gap-3">
        <Button>Hoje</Button>
        <Button aria-label="Semana anterior">‹</Button>
        <Button aria-label="Próxima semana">›</Button>
        <h2 className="ml-2 font-display text-xl font-semibold">31 de agosto — 4 de setembro de 2026</h2>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <thead className="bg-sand"><tr><th scope="col" className="w-20 px-3 py-3 text-left">Hora</th>{days.map((d) => <th key={d} scope="col" className="py-3 font-semibold">{d}</th>)}</tr></thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h} className="border-t border-line">
                <th scope="row" className="bg-sand/50 px-3 text-left font-normal text-muted">{h}</th>
                {days.map((_, i) => {
                  const k = `${h}-${i}`; const e = ev[k]
                  return (
                    <td key={i} className="h-16 border-l border-line p-1.5">
                      {e && (
                        <button onClick={() => setSel(k)} aria-pressed={sel === k} className={`w-full rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs transition-colors ${e[1].includes('Pendente') ? 'border-amber-500 bg-amber-50' : 'border-brand bg-brand-soft'} ${sel === k ? 'ring-2 ring-ink' : ''}`}>
                          <span className="block font-semibold">{e[0]}</span>{e[1]}
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {sel ? `Selecionada: ${ev[sel].join(' — ')}` : 'Situação escrita: Aguardando professor / Confirmada / Recusada / Cancelada. Selecione uma aula para consultar os detalhes.'}
      </p>
    </div>
  )
}

export function Agendar({ go }: { go: Go }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><H1>Agendar aula</H1><Button onClick={() => go('agenda')}>Voltar à agenda</Button></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <H2>Dados da aula</H2>
          <form className="mt-5 grid gap-4 md:grid-cols-6" onSubmit={(e) => { e.preventDefault(); go('agenda') }}>
            <Field className="md:col-span-6" label="Aluno ou turma" required options={['Selecione um aluno ou turma', 'Aluno 01', 'Aluno 02', 'Turma A']} />
            <Field className="md:col-span-3" label="Instrumento" required options={['Piano', 'Violão', 'Canto']} />
            <Field className="md:col-span-3" label="Professor" required options={['Professor(a) 01', 'Professor(a) 02']} />
            <Field className="md:col-span-6" label="Endereço da aula" options={['Selecione um endereço', 'Rua Topázio, 258 — Aclimação']} />
            <Field className="md:col-span-2" label="Data" required type="date" defaultValue="2026-09-04" />
            <Field className="md:col-span-2" label="Horário" required options={['09:00', '10:00', '11:00']} />
            <Field className="md:col-span-2" label="Duração" required options={['50 minutos', '30 minutos', '80 minutos']} />
            <Field className="md:col-span-6" label="Objetivo / adaptação para esta aula" textarea placeholder="Descreva o objetivo e como prefere aprender" />
            <div className="flex gap-3 md:col-span-6"><Button variant="primary" className="flex-1">Enviar solicitação</Button><Button type="button" className="flex-1" onClick={() => go('agenda')}>Cancelar</Button></div>
          </form>
        </Card>
        <div className="space-y-5">
          <Card tone="brand">
            <H2>Resumo</H2>
            <dl className="mt-4 space-y-1"><dt className="sr-only">Instrumento</dt><dd className="font-semibold">Piano</dd><dd>Professor(a) 01</dd><dd>Sexta-feira, 04/09</dd><dd>09:00 às 09:50</dd><dd className="text-muted">Sala a confirmar</dd></dl>
            <p className="mt-6 border-t border-brand/20 pt-4 text-sm text-muted">O professor recebe o plano e aceita ou recusa. O status aparece na agenda do aluno.</p>
          </Card>
          <Card><h2 className="font-semibold">Primeiro contato</h2><p className="mt-2 text-sm text-muted">Para visitantes: usar nome e contato no lugar de aluno cadastrado. A escola confirma a solicitação de aula experimental.</p></Card>
        </div>
      </div>
    </div>
  )
}

export function Verificacoes() {
  const [list, setList] = useState([
    ['Professor 01', 'Piano', 'Verificado'], ['Professor 02', 'Violão', 'Pendente'],
    ['Professor 03', 'Canto', 'Verificado'], ['Professor 04', 'Piano', 'Não autorizado'],
  ])
  const [sel, setSel] = useState(0)
  const setStatus = (s: string) => setList(list.map((p, i) => (i === sel ? [p[0], p[1], s] : p)))
  return (
    <div className="space-y-6">
      <H1>Cadastro e verificação de professores</H1>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="flex flex-col gap-4">
          <Field label="Professores cadastrados" placeholder="Nome ou e-mail" type="search" />
          <Button variant="primary">+ Cadastrar professor</Button>
          <ul className="space-y-2">
            {list.map(([n, inst, st], i) => (
              <li key={n}><button onClick={() => setSel(i)} aria-current={sel === i} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${sel === i ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink'}`}>
                <span><span className="block font-semibold">{n}</span><span className="text-sm text-muted">{inst}</span></span><Badge>{st}</Badge>
              </button></li>
            ))}
          </ul>
          <div className="mt-auto border-t border-line pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Ações do administrador</p>
            <div className="grid grid-cols-2 gap-3"><Button variant="primary" onClick={() => setStatus('Verificado')}>Autorizar</Button><Button onClick={() => setStatus('Não autorizado')}>Negar</Button></div>
          </div>
        </Card>
        <Card>
          <H2>Dados e preferências do professor</H2>
          <form key={sel} className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            <Field className="md:col-span-2" label="Nome completo" required defaultValue={list[sel][0]} />
            <Field className="md:col-span-2" label="E-mail de acesso" required type="email" defaultValue={`professor0${sel + 1}@exemplo.com`} />
            <Field label="Telefone de contato" type="tel" placeholder="(11) 00000-0000" />
            <Field label="Instrumento" options={['Piano', 'Violão', 'Canto']} defaultValue={list[sel][1]} />
            <Field className="md:col-span-2" label="Disponibilidade para aulas" placeholder="Ex.: seg–sex, manhã e tarde" />
            <Field className="md:col-span-2" label="Perfil de ensino / alunos que prefere atender" textarea rows={2} placeholder="Ex.: iniciantes, apoio visual e rotina estruturada" />
            <div className="flex gap-3 md:col-span-2"><Button variant="primary" className="flex-1">Enviar para verificação</Button><Button type="button" className="flex-1">Cancelar</Button></div>
          </form>
        </Card>
      </div>
    </div>
  )
}

/* ---------- Professor ---------- */
export function PortalProfessor({ go }: { go: Go }) {
  const [plan, setPlan] = useState<string | null>(null)
  return (
    <div className="space-y-8">
      <H1 sub="Conta verificada. Confira seus alunos, horários e planos de aula.">Olá, Professor(a) 01</H1>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card tone="brand">
          <H2>Sua próxima aula</H2>
          <p className="mt-3 text-lg">Piano • Sexta-feira, 4 de setembro<br />09:00 às 09:50 • Aluno 01 (iniciante)</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button variant="primary" onClick={() => go('agenda')}>Ver minha agenda</Button><Button>Definir disponibilidade</Button></div>
        </Card>
        <Card>
          <H2>Solicitações de planos</H2>
          <p className="mt-3">Aluno 02 • Piano<br /><span className="text-muted">Plano de aula pendente · Nível: iniciante</span></p>
          {plan ? <p role="status" className="mt-6 font-semibold text-brand">Plano {plan}.</p> : (
            <div className="mt-6 grid grid-cols-2 gap-3"><Button variant="primary" onClick={() => setPlan('aceito')}>Aceitar plano</Button><Button onClick={() => setPlan('recusado')}>Recusar plano</Button></div>
          )}
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4"><H2>Meu perfil de ensino</H2>
          <Card><h3 className="text-lg font-semibold">Preferências e especialidades</h3><p className="mt-3 text-muted">Iniciantes e intermediários.<br />Estratégias: apoio visual e rotina estruturada.<br />Ajustar à necessidade de cada aluno.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button>Editar minhas preferências</Button><Button>Ver meus alunos</Button></div></Card>
        </section>
        <section className="space-y-4"><H2>Planejamento e materiais</H2>
          <Card tone="sand"><p className="text-sm font-semibold">Próxima atividade</p><p className="mt-2 text-sm text-muted">Prepare suas aulas, escolha materiais e registre o progresso do aluno após o encontro.</p></Card>
          <Button variant="primary" className="w-full" onClick={() => go('conteudos')}>Configurar materiais</Button>
        </section>
      </div>
    </div>
  )
}

export function Planejar() {
  const [status, setStatus] = useState<string | null>(null)
  return (
    <div className="space-y-6">
      <H1>Planejar aula</H1>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Aluno ou turma" options={['Aluno 01', 'Aluno 02', 'Turma A']} />
        <Field label="Aula" options={['Piano • 04/09/2026 • 09:00', 'Piano • 11/09/2026 • 09:00']} />
      </div>
      <Field label="Objetivo de aprendizagem" textarea rows={2} defaultValue={'Aluno iniciante • prefere orientações curtas.\nObjetivo: reconhecer pulsação e executar um ritmo simples.'} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <H2>Etapas da aula</H2>
        {status ? <p role="status" className="font-semibold text-brand">Plano {status}.</p> : <div className="flex gap-3"><Button variant="primary" onClick={() => setStatus('aceito')}>Aceitar plano</Button><Button onClick={() => setStatus('recusado')}>Recusar plano</Button></div>}
      </div>
      <Table head={['Duração', 'Atividade', 'Material / adaptação']} rows={[
        ['10 min', 'Acolhimento e revisão', 'Roteiro escrito da aula'], ['15 min', 'Exercício de pulsação', 'Áudio em velocidade ajustável'],
        ['20 min', 'Prática orientada', 'Partitura + exemplo em áudio'], ['5 min', 'Retomada e próximos passos', 'Resumo em texto'],
      ]} />
      <div className="grid items-end gap-4 md:grid-cols-[1fr_240px]">
        <Field label="Registro após a aula — dificuldades e progresso" textarea rows={2} placeholder="Registrar progresso para atualizar o perfil do aluno" />
        <div className="flex flex-col gap-3"><Button>Salvar rascunho</Button><Button variant="primary">Compartilhar com aluno</Button></div>
      </div>
    </div>
  )
}

export function Conteudos() {
  const items = [['Primeiros acordes', 'PDF • Violão', 'Publicado'], ['Exercício de pulsação', 'Áudio + texto • Piano', 'Publicado'], ['Aquecimento vocal', 'Vídeo + transcrição', 'Rascunho']]
  return (
    <div className="space-y-6">
      <H1>Conteúdos educacionais</H1>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <Field label="Buscar conteúdo" type="search" placeholder="Título do material" />
        <Field label="Instrumento" options={['Todos', 'Piano', 'Violão', 'Canto']} />
        <Field label="Formato" options={['Todos', 'PDF', 'Áudio', 'Vídeo']} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><H2>Biblioteca</H2>
          <ul className="mt-5 space-y-3">{items.map(([t, m, s]) => (
            <li key={t} className="rounded-xl border border-line p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-lg font-semibold">{t}</h3><Badge>{s}</Badge></div>
              <p className="mt-1 text-sm text-muted">{m}</p><a href="#" className="mt-3 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline">Abrir material →</a></li>
          ))}</ul>
        </Card>
        <Card><H2>Configurar material de aula</H2>
          <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field label="Título" required defaultValue="Exercício de pulsação" />
            <Field label="Destino" required options={['Aluno 01 / Piano', 'Aluno 02 / Violão', 'Turma A / Canto']} />
            <Field label="Arquivo do material" required type="file" />
            <Field label="Resumo / alternativa em texto" textarea placeholder="Descreva a atividade e inclua transcrição" />
            <div className="grid grid-cols-2 gap-3"><Button type="button">Salvar rascunho</Button><Button variant="primary">Publicar</Button></div>
          </form>
        </Card>
      </div>
    </div>
  )
}

/* ---------- Aluno ---------- */
export function CadastroAluno({ go }: { go: Go }) {
  const [resp, setResp] = useState(1)
  return (
    <div className="space-y-6">
      <H1>Cadastro do aluno e responsáveis</H1>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="space-y-3">
          <p className="text-sm font-semibold">Perfil de aprendizagem</p>
          <p className="text-sm text-muted">Criado no cadastro; atualizado após cada aula.</p>
          <p className="rounded-lg bg-brand px-4 py-3 text-center font-semibold text-white">Nível musical: iniciante</p>
          {[['Objetivo', 'Aprender piano'], ['Forma de aprender', 'Instruções claras'], ['Preferências', 'Rotina estruturada'], ['Evolução', 'Atualizada após as aulas']].map(([k, v], i) => (
            <div key={k} className={`rounded-xl border border-line px-4 py-3 ${i === 0 ? 'bg-sand' : ''}`}><p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p><p>{v}</p></div>
          ))}
        </Card>
        <Card><H2>Dados do aluno</H2>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); go('portal-aluno') }}>
            <Field className="md:col-span-2" label="Nome completo" required placeholder="Nome do aluno" />
            <Field className="md:col-span-2" label="E-mail de acesso" required type="email" placeholder="aluno@exemplo.com" />
            <Field label="Senha" required type="password" placeholder="Digite sua senha" />
            <Field label="Nível musical" options={['Iniciante', 'Intermediário', 'Avançado']} />
            {Array.from({ length: resp }, (_, i) => <Field key={i} className="md:col-span-2" label={`Responsável ${i + 1}, quando aplicável`} placeholder="Nome • vínculo • contato do responsável" />)}
            <Field className="md:col-span-2" label="Preferências e necessidades de aprendizagem" textarea rows={2} placeholder="Ex.: apoio visual, pausas e instruções curtas" />
            <Button variant="primary">Cadastrar aluno</Button>
            <Button type="button" onClick={() => setResp(resp + 1)}>+ Adicionar responsável</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export function PortalAluno({ go }: { go: Go }) {
  const [stars, setStars] = useState(0)
  const [sent, setSent] = useState('')
  return (
    <div className="space-y-8">
      <H1 sub="Consulte a rotina. Seu perfil de aprendizagem evolui após as aulas.">Olá, Aluno 01</H1>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card tone="brand"><H2>Sua próxima aula</H2>
          <p className="mt-3 text-lg">Piano • Sexta-feira, 4 de setembro<br />09:00 às 09:50 • Professor(a) 01</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button variant="primary" onClick={() => go('agenda')}>Ver minha agenda</Button><Button>Solicitar alteração</Button></div>
        </Card>
        <Card><H2>Avalie a aula concluída</H2>
          <p className="mt-2 text-muted">Piano • Aula de 02/09</p>
          <fieldset className="mt-3"><legend className="text-sm font-semibold">Qualidade</legend>
            <div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} aria-label={`${n} de 5`} aria-pressed={stars === n} className={`text-2xl ${n <= stars ? 'text-accent' : 'text-line'}`}>★</button>
            ))}</div></fieldset>
          <Field className="mt-3" label="Comentário (opcional)" />
          <Button variant="primary" className="mt-4 w-full" onClick={() => setSent('Avaliação enviada. Obrigado!')}>Enviar avaliação</Button>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4"><H2>Para estudar nesta semana</H2>
          <Card><h3 className="text-lg font-semibold">Pulsação e ritmo</h3>
            <p className="mt-3 text-muted">Objetivo: manter uma pulsação regular.</p>
            <ol className="mt-2 list-inside list-decimal text-muted"><li>Ouça o exemplo.</li><li>Pratique no seu ritmo.</li></ol>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button>Abrir áudio + texto</Button><Button>Ver plano da aula</Button></div></Card>
        </section>
        <section className="space-y-4"><H2>Fale com o professor</H2>
          <Field label="Mensagem" textarea rows={4} placeholder="Escreva sua dúvida sobre a aula..." />
          <Button variant="primary" className="w-full" onClick={() => setSent('Mensagem enviada ao Professor(a) 01.')}>Enviar mensagem</Button>
        </section>
      </div>
      <p role="status" className="text-sm font-semibold text-brand">{sent}</p>
    </div>
  )
}

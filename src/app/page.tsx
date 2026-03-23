import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-primary">AprovAI</span>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-foreground">
              Entrar
            </Link>
            <Link href="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
              Comecar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Analise cadastral de locacao{" "}
            <span className="text-primary">em minutos, nao em dias</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Receba documentos via WhatsApp, analise com IA, consulte credito e tribunais automaticamente.
            Feche negocios antes que o cliente esfrie.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/register" className="rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark">
              Comecar gratis - 5 analises
            </Link>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Sua imobiliaria tem esses problemas?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-6">
              <div className="mb-3 text-2xl">&#9200;</div>
              <h3 className="mb-2 font-semibold text-danger">Perde o timing da locacao</h3>
              <p className="text-sm text-muted">
                A demora na analise faz o cliente repensar ou fechar com um concorrente mais rapido.
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-6">
              <div className="mb-3 text-2xl">&#128176;</div>
              <h3 className="mb-2 font-semibold text-danger">Prejuizo com inadimplencia</h3>
              <p className="text-sm text-muted">
                Analise superficial aprova inquilinos de risco. Prejuizo medio de R$ 4.600 por contrato inadimplente.
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-6">
              <div className="mb-3 text-2xl">&#128241;</div>
              <h3 className="mb-2 font-semibold text-danger">Caos no WhatsApp</h3>
              <p className="text-sm text-muted">
                Alto volume de mensagens sem automacao sobrecarrega corretores e esfria leads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-sidebar px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Como funciona</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { step: "1", title: "Inquilino envia docs", desc: "Via WhatsApp: RG, comprovante de renda e residencia" },
              { step: "2", title: "IA analisa", desc: "Claude Vision le os documentos e extrai dados em segundos" },
              { step: "3", title: "Consultas automaticas", desc: "Credito (Serasa) + processos judiciais (DataJud/CNJ)" },
              { step: "4", title: "Resultado instantaneo", desc: "Ficha aprovada ou reprovada com score e motivos" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-1 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Planos</h2>
          <p className="mb-12 text-center text-muted">Comece gratis. Pague so quando gerar valor.</p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">Trial</h3>
              <p className="mt-2 text-3xl font-bold">Gratis</p>
              <p className="mt-1 text-sm text-muted">5 analises incluidas</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li>&#10003; Analise com IA</li>
                <li>&#10003; Consulta DataJud</li>
                <li>&#10003; WhatsApp bot</li>
                <li>&#10003; Dashboard</li>
              </ul>
              <Link href="/register" className="mt-6 block rounded-lg border border-primary px-4 py-2 text-center text-sm font-medium text-primary hover:bg-primary/5">
                Comecar gratis
              </Link>
            </div>
            <div className="relative rounded-xl border-2 border-primary bg-card p-6 shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-white">
                Popular
              </span>
              <h3 className="text-lg font-semibold">Starter</h3>
              <p className="mt-2 text-3xl font-bold">R$ 29<span className="text-base font-normal text-muted">/analise</span></p>
              <p className="mt-1 text-sm text-muted">Sem mensalidade</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li>&#10003; Tudo do Trial</li>
                <li>&#10003; Consulta Serasa/SPC</li>
                <li>&#10003; Score de risco</li>
                <li>&#10003; Suporte por email</li>
              </ul>
              <Link href="/register" className="mt-6 block rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-dark">
                Comecar agora
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-2 text-3xl font-bold">R$ 997<span className="text-base font-normal text-muted">/mes</span></p>
              <p className="mt-1 text-sm text-muted">Analises ilimitadas</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li>&#10003; Tudo do Starter</li>
                <li>&#10003; Ilimitado</li>
                <li>&#10003; Suporte prioritario</li>
                <li>&#10003; Relatorios PDF</li>
              </ul>
              <Link href="/register" className="mt-6 block rounded-lg border border-primary px-4 py-2 text-center text-sm font-medium text-primary hover:bg-primary/5">
                Falar com vendas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-bold">Pare de perder locacoes</h2>
        <p className="mt-3 text-blue-100">
          Cada dia sem automacao e dinheiro perdido. Comece em 5 minutos.
        </p>
        <Link href="/register" className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-semibold text-primary shadow-lg hover:bg-blue-50">
          Criar conta gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-sidebar px-6 py-8 text-center text-sm text-muted">
        <p>AprovAI - Analise cadastral com inteligencia artificial</p>
        <p className="mt-1">Um produto ROI Labs</p>
      </footer>
    </div>
  );
}

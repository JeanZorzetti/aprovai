"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Analysis {
  id: string;
  status: string;
  applicantName: string | null;
  applicantCpf: string | null;
  applicantPhone: string;
  incomeEstimate: string | null;
  riskScore: number | null;
  decision: string | null;
  decisionReason: string | null;
  creditData: Record<string, unknown> | null;
  courtData: { totalProcessos?: number; processos?: Array<{ classe: string; tribunal: string; dataAjuizamento: string }> } | null;
  documentData: Record<string, unknown> | null;
  propertyRef: string | null;
  rentValue: string | null;
  documents: Array<{ id: string; type: string; mimeType: string; createdAt: string }>;
  createdAt: string;
  completedAt: string | null;
}

export default function AnaliseDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/analyses/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
      });
  }, [params.id]);

  async function handleOverride(decision: string) {
    const token = localStorage.getItem("token");
    await fetch(`/api/analyses/${params.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    router.refresh();
    window.location.reload();
  }

  if (loading) return <p className="text-muted">Carregando...</p>;
  if (!analysis) return <p className="text-danger">Analise nao encontrada.</p>;

  const scoreColor = analysis.riskScore !== null
    ? analysis.riskScore >= 70 ? "text-success" : analysis.riskScore >= 40 ? "text-warning" : "text-danger"
    : "";

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.back()} className="mb-4 text-sm text-muted hover:text-foreground">
        &larr; Voltar
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{analysis.applicantName || "Sem nome"}</h1>
          <p className="text-sm text-muted">CPF: {analysis.applicantCpf || "N/I"} | Tel: {analysis.applicantPhone}</p>
        </div>
        {analysis.riskScore !== null && (
          <div className="text-right">
            <p className="text-sm text-muted">Score</p>
            <p className={`text-4xl font-bold ${scoreColor}`}>{analysis.riskScore}</p>
          </div>
        )}
      </div>

      {/* Decision banner */}
      {analysis.decision && (
        <div className={`mb-6 rounded-xl p-4 ${
          analysis.decision === "approved" ? "bg-green-50 border border-green-200" :
          analysis.decision === "rejected" ? "bg-red-50 border border-red-200" :
          "bg-orange-50 border border-orange-200"
        }`}>
          <p className="font-semibold">
            {analysis.decision === "approved" ? "Aprovado" :
             analysis.decision === "rejected" ? "Reprovado" : "Revisao manual necessaria"}
          </p>
          {analysis.decisionReason && (
            <ul className="mt-2 space-y-1 text-sm">
              {analysis.decisionReason.split("; ").map((r, i) => (
                <li key={i}>- {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Override buttons */}
      {analysis.decision === "manual_review" && (
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => handleOverride("approved")}
            className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Aprovar manualmente
          </button>
          <button
            onClick={() => handleOverride("rejected")}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Reprovar
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Dados do inquilino</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Renda estimada</dt>
              <dd className="font-medium">
                {analysis.incomeEstimate ? `R$ ${Number(analysis.incomeEstimate).toLocaleString("pt-BR")}` : "N/I"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Valor do aluguel</dt>
              <dd className="font-medium">
                {analysis.rentValue ? `R$ ${Number(analysis.rentValue).toLocaleString("pt-BR")}` : "N/I"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Ref. imovel</dt>
              <dd className="font-medium">{analysis.propertyRef || "N/I"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Data da analise</dt>
              <dd className="font-medium">{new Date(analysis.createdAt).toLocaleDateString("pt-BR")}</dd>
            </div>
          </dl>
        </div>

        {/* Documentos */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Documentos recebidos</h3>
          {analysis.documents.length === 0 ? (
            <p className="text-sm text-muted">Nenhum documento.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded-lg bg-sidebar px-3 py-2 text-sm">
                  <span className="font-medium capitalize">{doc.type}</span>
                  <span className="text-xs text-muted">{doc.mimeType}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Processos judiciais */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Processos judiciais (DataJud)</h3>
          {!analysis.courtData ? (
            <p className="text-sm text-muted">Nao consultado.</p>
          ) : analysis.courtData.totalProcessos === 0 ? (
            <p className="text-sm text-success">Nenhum processo encontrado.</p>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-danger">
                {analysis.courtData.totalProcessos} processo(s) encontrado(s)
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                {analysis.courtData.processos?.map((p, i) => (
                  <li key={i} className="rounded bg-red-50 px-2 py-1.5">
                    <span className="font-medium">{p.classe}</span>
                    <span className="ml-2 text-muted">{p.tribunal} | {p.dataAjuizamento?.slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Credito */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Consulta de credito</h3>
          {!analysis.creditData ? (
            <p className="text-sm text-muted">Nao consultado.</p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Provider</dt>
                <dd className="font-medium">{(analysis.creditData as Record<string, unknown>).provider as string || "N/I"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Score</dt>
                <dd className="font-medium">{(analysis.creditData as Record<string, unknown>).score as string || "N/I"}/1000</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Status</dt>
                <dd className={`font-medium ${(analysis.creditData as Record<string, unknown>).status === "clean" ? "text-success" : "text-danger"}`}>
                  {(analysis.creditData as Record<string, unknown>).status === "clean" ? "Limpo" : "Pendencias"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

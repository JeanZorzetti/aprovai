"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Analysis {
  id: string;
  status: string;
  applicantName: string | null;
  applicantCpf: string | null;
  applicantPhone: string;
  riskScore: number | null;
  decision: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-gray-100 text-gray-700" },
  collecting: { label: "Coletando docs", className: "bg-blue-50 text-blue-700" },
  processing: { label: "Processando", className: "bg-yellow-50 text-yellow-700" },
  approved: { label: "Aprovado", className: "bg-green-50 text-green-700" },
  rejected: { label: "Reprovado", className: "bg-red-50 text-red-700" },
  manual_review: { label: "Revisao", className: "bg-orange-50 text-orange-700" },
};

export default function AnalisesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const params = filter ? `?status=${filter}` : "";
    fetch(`/api/analyses${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setAnalyses(data.analyses || []);
        setLoading(false);
      });
  }, [filter]);

  const filters = ["", "collecting", "processing", "approved", "rejected", "manual_review"];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Analises</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            {f === "" ? "Todas" : STATUS_LABELS[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : analyses.length === 0 ? (
        <p className="text-muted">Nenhuma analise encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-sidebar">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted">CPF</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {analyses.map((a) => {
                const st = STATUS_LABELS[a.status] || { label: a.status, className: "bg-gray-100 text-gray-700" };
                return (
                  <tr key={a.id} className="hover:bg-sidebar/50">
                    <td className="px-4 py-3 font-medium">{a.applicantName || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.applicantCpf || "-"}</td>
                    <td className="px-4 py-3">{a.applicantPhone}</td>
                    <td className="px-4 py-3">
                      {a.riskScore !== null ? (
                        <span className={`font-semibold ${
                          a.riskScore >= 70 ? "text-success" : a.riskScore >= 40 ? "text-warning" : "text-danger"
                        }`}>
                          {a.riskScore}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/analises/${a.id}`}
                        className="text-primary hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

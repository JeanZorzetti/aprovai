"use client";

import { useEffect, useState } from "react";

interface Stats {
  total: number;
  approved: number;
  rejected: number;
  manual_review: number;
  processing: number;
  collecting: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [org, setOrg] = useState<{ name: string; credits: number; plan: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    fetch("/api/organizations", { headers })
      .then((r) => r.json())
      .then(setOrg);

    fetch("/api/analyses?limit=1000", { headers })
      .then((r) => r.json())
      .then((data) => {
        const analyses = data.analyses || [];
        setStats({
          total: analyses.length,
          approved: analyses.filter((a: { status: string }) => a.status === "approved").length,
          rejected: analyses.filter((a: { status: string }) => a.status === "rejected").length,
          manual_review: analyses.filter((a: { status: string }) => a.status === "manual_review").length,
          processing: analyses.filter((a: { status: string }) => a.status === "processing").length,
          collecting: analyses.filter((a: { status: string }) => a.status === "collecting").length,
        });
      });
  }, []);

  const cards = stats
    ? [
        { label: "Total", value: stats.total, color: "text-foreground" },
        { label: "Aprovadas", value: stats.approved, color: "text-success" },
        { label: "Reprovadas", value: stats.rejected, color: "text-danger" },
        { label: "Revisao manual", value: stats.manual_review, color: "text-warning" },
        { label: "Em andamento", value: stats.processing + stats.collecting, color: "text-primary" },
      ]
    : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visao geral</h1>
          {org && <p className="text-sm text-muted">{org.name}</p>}
        </div>
        {org && (
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            <span className="text-muted">Creditos: </span>
            <span className="font-semibold">{org.credits}</span>
            <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {org.plan}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {stats && stats.total === 0 && (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted">Nenhuma analise ainda</p>
          <p className="mt-2 text-sm text-muted">
            Configure seu WhatsApp na aba{" "}
            <a href="/dashboard/whatsapp" className="text-primary hover:underline">
              WhatsApp
            </a>{" "}
            para comecar a receber documentos.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", organizationName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erro ao criar conta");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">AprovAI</h1>
          <p className="mt-2 text-muted">Crie sua conta e comece a analisar</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">Criar conta</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Nome da imobiliaria</label>
            <input
              type="text"
              value={form.organizationName}
              onChange={(e) => update("organizationName", e.target.value)}
              placeholder="Ex: Imobiliaria Silva"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Seu nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              minLength={6}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta gratuita"}
          </button>

          <p className="mt-4 text-center text-sm text-muted">
            Ja tem conta?{" "}
            <a href="/login" className="text-primary hover:underline">
              Entrar
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

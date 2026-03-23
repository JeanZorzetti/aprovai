"use client";

import { useEffect, useState } from "react";

export default function WhatsAppPage() {
  const [status, setStatus] = useState<string>("loading");
  const [qrCode, setQrCode] = useState<string>("");
  const [instanceName, setInstanceName] = useState<string>("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/organizations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const org = await res.json();

    if (org?.instance) {
      setInstanceName(org.instance.instanceName);
      setStatus(org.instance.status);
      if (org.instance.status !== "connected") {
        connectAndGetQr(org.instance.instanceName);
      }
    } else {
      setStatus("no_instance");
    }
  }

  async function connectAndGetQr(name: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/whatsapp/connect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ instanceName: name }),
    });
    const data = await res.json();
    if (data.qrcode?.base64) {
      setQrCode(data.qrcode.base64);
      setStatus("qr_ready");
    }
  }

  async function handleCreate() {
    setCreating(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/whatsapp/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.instanceName) {
      setInstanceName(data.instanceName);
      setTimeout(() => connectAndGetQr(data.instanceName), 2000);
    }
    setCreating(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">WhatsApp</h1>

      {status === "loading" && <p className="text-muted">Carregando...</p>}

      {status === "connected" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="font-semibold text-success">Conectado</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            Instancia: <span className="font-mono">{instanceName}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            O bot esta ativo e recebendo documentos via WhatsApp.
          </p>
        </div>
      )}

      {status === "qr_ready" && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="mb-4 font-medium">Escaneie o QR Code com seu WhatsApp</p>
          {qrCode && (
            <img
              src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
              alt="QR Code WhatsApp"
              className="mx-auto h-64 w-64"
            />
          )}
          <p className="mt-4 text-sm text-muted">
            Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar um aparelho
          </p>
          <button
            onClick={fetchStatus}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
          >
            Verificar conexao
          </button>
        </div>
      )}

      {status === "no_instance" && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="mb-4 text-muted">Nenhuma instancia WhatsApp configurada.</p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {creating ? "Criando..." : "Configurar WhatsApp"}
          </button>
        </div>
      )}

      {status === "disconnected" && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
          <p className="font-medium text-warning">WhatsApp desconectado</p>
          <p className="mt-1 text-sm text-muted">
            Instancia: <span className="font-mono">{instanceName}</span>
          </p>
          <button
            onClick={() => connectAndGetQr(instanceName)}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
          >
            Reconectar
          </button>
        </div>
      )}
    </div>
  );
}

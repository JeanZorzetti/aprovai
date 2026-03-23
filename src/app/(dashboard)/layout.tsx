"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visao geral" },
  { href: "/dashboard/analises", label: "Analises" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "aprovai_token=; Path=/; Max-Age=0";
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="border-b border-border p-5">
          <h1 className="text-xl font-bold text-primary">AprovAI</h1>
        </div>

        <nav className="flex-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-gray-100 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-muted hover:text-danger"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background p-8">
        {children}
      </main>
    </div>
  );
}

"use client";

import { listGuests } from "@/lib/api/guests";
import type { GuestRead } from "@/lib/api/guests";
import { normalizeResponseStatus } from "@/lib/guest-status";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
    >
      {theme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const [guests, setGuests] = useState<GuestRead[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [guestLoadError, setGuestLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setLoadingGuests(true);
      setGuestLoadError(null);
      try {
        const data = await listGuests();
        setGuests(data);
      } catch (err) {
        setGuestLoadError(
          err instanceof Error ? err.message : "Erro ao carregar estatísticas dos convidados"
        );
      } finally {
        setLoadingGuests(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400 dark:text-stone-500 text-sm">Carregando...</div>
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] ?? user?.full_name ?? "";

  const stats = [
    {
      label: "Total de convidados",
      value: guests.length,
      description: "cadastrados",
      valueClass: "text-stone-900 dark:text-stone-100",
    },
    {
      label: "Confirmados",
      value: guests.filter((g) => normalizeResponseStatus(g.response_status) === "confirmed")
        .length,
      description: "confirmaram presença",
      valueClass: "text-emerald-700 dark:text-emerald-400",
    },
    {
      label: "Aguardando resposta",
      value: guests.filter((g) => normalizeResponseStatus(g.response_status) === "pending").length,
      description: "sem resposta",
      valueClass: "text-amber-700 dark:text-amber-400",
    },
    {
      label: "Ausentes",
      value: guests.filter((g) => normalizeResponseStatus(g.response_status) === "absent").length,
      description: "não poderão comparecer",
      valueClass: "text-red-700 dark:text-red-400",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <nav className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <span className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                Wedding Inviter
              </span>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 pb-0.5"
              >
                Painel
              </Link>
              <Link
                href="/dashboard/guests"
                className="text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Convidados
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Olá, {firstName}!
          </h1>
          <p className="mt-1 text-stone-500 dark:text-stone-400 text-sm">
            Aqui está um resumo do seu casamento.
          </p>
        </div>

        {guestLoadError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400"
          >
            Não foi possível carregar as estatísticas agora. {guestLoadError}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6"
            >
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                {stat.label}
              </p>
              {loadingGuests ? (
                <div className="h-10 w-16 bg-stone-100 dark:bg-stone-700 rounded animate-pulse" />
              ) : guestLoadError ? (
                <p className="text-4xl font-bold tabular-nums text-stone-300 dark:text-stone-600">
                  N/D
                </p>
              ) : (
                <p className={`text-4xl font-bold tabular-nums ${stat.valueClass}`}>{stat.value}</p>
              )}
              <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">{stat.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">
              Gerenciar convidados
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Adicione convidados, edite informações e acompanhe os convites enviados.
            </p>
          </div>
          <Link
            href="/dashboard/guests"
            className="flex-shrink-0 ml-6 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
          >
            Ver convidados
          </Link>
        </div>
      </main>
    </div>
  );
}

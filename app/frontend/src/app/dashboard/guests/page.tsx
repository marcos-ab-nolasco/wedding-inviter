"use client";

import { deleteGuest, listGuests } from "@/lib/api/guests";
import type { GuestRead } from "@/lib/api/guests";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function InviteStatusBadge({ status }: { status: string }) {
  if (status === "enviado") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Enviado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Pendente
    </span>
  );
}

function ResponseStatusBadge({ status }: { status: string }) {
  if (status === "confirmado") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Confirmado
      </span>
    );
  }
  if (status === "ausente") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Ausente
      </span>
    );
  }
  if (status === "incerto") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        Incerto
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Pendente
    </span>
  );
}

function DeleteDialog({
  guestName,
  onConfirm,
  onCancel,
}: {
  guestName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar exclusão</h3>
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir <span className="font-medium">{guestName}</span>? Esta ação
          não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestsPage() {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const [guests, setGuests] = useState<GuestRead[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuestRead | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchGuests = useCallback(async () => {
    setLoadingGuests(true);
    setError(null);
    try {
      const data = await listGuests();
      setGuests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar convidados");
    } finally {
      setLoadingGuests(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGuests();
    }
  }, [isAuthenticated, fetchGuests]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteGuest(deleteTarget.id);
      setGuests((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir convidado");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                Wedding Inviter
              </Link>
              <Link
                href="/dashboard/guests"
                className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 pb-0.5"
              >
                Convidados
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Convidados</h1>
          <Link
            href="/dashboard/guests/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
          >
            Adicionar convidado
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingGuests ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Carregando convidados...
          </div>
        ) : guests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">Nenhum convidado cadastrado ainda.</p>
            <Link
              href="/dashboard/guests/new"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
            >
              Adicionar primeiro convidado
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cidade/Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intimidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Convite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resposta
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                      {guest.nickname && (
                        <div className="text-xs text-gray-500">{guest.nickname}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.city && guest.state
                        ? `${guest.city}/${guest.state}`
                        : guest.city || guest.state || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.intimacy || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InviteStatusBadge status={guest.invite_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ResponseStatusBadge status={guest.response_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/guests/${guest.id}/edit`}
                          className="px-3 py-1 text-xs text-indigo-600 border border-indigo-300 rounded hover:bg-indigo-50 transition"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(guest)}
                          className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {deleteTarget && (
        <DeleteDialog
          guestName={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

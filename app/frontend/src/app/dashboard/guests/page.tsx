"use client";

import { createGuest, deleteGuest, listGuests, updateGuest } from "@/lib/api/guests";
import type { GuestCreate, GuestRead, GuestUpdate } from "@/lib/api/guests";
import {
  getInviteStatusMeta,
  getResponseStatusMeta,
  inviteStatusOptions,
  normalizeInviteStatus,
  normalizeResponseStatus,
  responseStatusOptions,
  type InviteStatus,
  type ResponseStatus,
} from "@/lib/guest-status";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

function InviteStatusBadge({ status }: { status: string }) {
  const meta = getInviteStatusMeta(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function ResponseStatusBadge({ status }: { status: string }) {
  const meta = getResponseStatusMeta(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.className}`}
    >
      {meta.label}
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

type GuestFormValues = {
  name: string;
  nickname: string;
  relationship_type: string;
  city: string;
  state: string;
  is_distant: boolean;
  friendship_level: string;
  intimacy: string;
  contact_frequency: string;
  last_contact_medium: string;
  ideal_tone: string;
  memory: string;
  shared_element: string;
  invite_status: InviteStatus;
  response_status: ResponseStatus;
  notes: string;
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const sectionHeadingClass =
  "text-base font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200";

function GuestFormModal({
  guest,
  onClose,
  onSuccess,
}: {
  guest?: GuestRead;
  onClose: () => void;
  onSuccess: (saved: GuestRead) => void;
}) {
  const isEdit = !!guest;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestFormValues>({
    defaultValues: {
      name: guest?.name ?? "",
      nickname: guest?.nickname ?? "",
      relationship_type: guest?.relationship_type ?? "",
      city: guest?.city ?? "",
      state: guest?.state ?? "",
      is_distant: guest?.is_distant ?? false,
      friendship_level: guest?.friendship_level ?? "",
      intimacy: guest?.intimacy ?? "",
      contact_frequency: guest?.contact_frequency ?? "",
      last_contact_medium: guest?.last_contact_medium ?? "",
      ideal_tone: guest?.ideal_tone ?? "",
      memory: guest?.memory ?? "",
      shared_element: guest?.shared_element ?? "",
      invite_status: normalizeInviteStatus(guest?.invite_status),
      response_status: normalizeResponseStatus(guest?.response_status),
      notes: guest?.notes ?? "",
    },
  });

  const onSubmit = async (values: GuestFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const nullIfEmpty = (v: string) => v.trim() || null;
      if (isEdit && guest) {
        const body: GuestUpdate = {
          name: values.name,
          nickname: nullIfEmpty(values.nickname),
          relationship_type: nullIfEmpty(values.relationship_type),
          city: nullIfEmpty(values.city),
          state: nullIfEmpty(values.state),
          is_distant: values.is_distant,
          friendship_level: nullIfEmpty(values.friendship_level),
          intimacy: nullIfEmpty(values.intimacy),
          contact_frequency: nullIfEmpty(values.contact_frequency),
          last_contact_medium: nullIfEmpty(values.last_contact_medium),
          ideal_tone: nullIfEmpty(values.ideal_tone),
          memory: nullIfEmpty(values.memory),
          shared_element: nullIfEmpty(values.shared_element),
          invite_status: values.invite_status,
          response_status: values.response_status,
          notes: nullIfEmpty(values.notes),
        };
        const saved = await updateGuest(guest.id, body);
        onSuccess(saved);
      } else {
        const body: GuestCreate = {
          name: values.name,
          nickname: nullIfEmpty(values.nickname),
          relationship_type: nullIfEmpty(values.relationship_type),
          city: nullIfEmpty(values.city),
          state: nullIfEmpty(values.state),
          is_distant: values.is_distant,
          friendship_level: nullIfEmpty(values.friendship_level),
          intimacy: nullIfEmpty(values.intimacy),
          contact_frequency: nullIfEmpty(values.contact_frequency),
          last_contact_medium: nullIfEmpty(values.last_contact_medium),
          ideal_tone: nullIfEmpty(values.ideal_tone),
          memory: nullIfEmpty(values.memory),
          shared_element: nullIfEmpty(values.shared_element),
          invite_status: values.invite_status,
          response_status: values.response_status,
          notes: nullIfEmpty(values.notes),
        };
        const saved = await createGuest(body);
        onSuccess(saved);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar convidado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Editar convidado" : "Adicionar convidado"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 px-6 py-4 space-y-6"
        >
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Section 1: Dados pessoais */}
          <div>
            <h3 className={sectionHeadingClass}>Dados pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="name" className={labelClass}>
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Nome é obrigatório" })}
                  className={inputClass}
                  placeholder="Nome completo"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="nickname" className={labelClass}>
                  Apelido
                </label>
                <input
                  id="nickname"
                  type="text"
                  {...register("nickname")}
                  className={inputClass}
                  placeholder="Como é chamado(a)"
                />
              </div>
              <div>
                <label htmlFor="relationship_type" className={labelClass}>
                  Tipo de relacionamento
                </label>
                <input
                  id="relationship_type"
                  type="text"
                  {...register("relationship_type")}
                  className={inputClass}
                  placeholder="Ex: amigo, familiar, colega"
                />
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>
                  Cidade
                </label>
                <input
                  id="city"
                  type="text"
                  {...register("city")}
                  className={inputClass}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>
                  Estado
                </label>
                <input
                  id="state"
                  type="text"
                  {...register("state")}
                  className={inputClass}
                  placeholder="UF"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="is_distant"
                  type="checkbox"
                  {...register("is_distant")}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_distant" className="text-sm text-gray-700">
                  Convidado distante (mora longe ou contato raro)
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Contexto para IA */}
          <div>
            <h3 className={sectionHeadingClass}>Contexto para IA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="friendship_level" className={labelClass}>
                  Nível de amizade
                </label>
                <input
                  id="friendship_level"
                  type="text"
                  {...register("friendship_level")}
                  className={inputClass}
                  placeholder="Ex: melhor amigo, conhecido"
                />
              </div>
              <div>
                <label htmlFor="intimacy" className={labelClass}>
                  Intimidade
                </label>
                <select id="intimacy" {...register("intimacy")} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="muito próximo">Muito próximo</option>
                  <option value="próximo">Próximo</option>
                  <option value="médio">Médio</option>
                  <option value="distante">Distante</option>
                </select>
              </div>
              <div>
                <label htmlFor="contact_frequency" className={labelClass}>
                  Frequência de contato
                </label>
                <select
                  id="contact_frequency"
                  {...register("contact_frequency")}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  <option value="diário">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                  <option value="raramente">Raramente</option>
                </select>
              </div>
              <div>
                <label htmlFor="last_contact_medium" className={labelClass}>
                  Último meio de contato
                </label>
                <select
                  id="last_contact_medium"
                  {...register("last_contact_medium")}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="telefone">Telefone</option>
                  <option value="pessoalmente">Pessoalmente</option>
                  <option value="redes sociais">Redes sociais</option>
                  <option value="email">E-mail</option>
                </select>
              </div>
              <div>
                <label htmlFor="ideal_tone" className={labelClass}>
                  Tom ideal
                </label>
                <select id="ideal_tone" {...register("ideal_tone")} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="formal">Formal</option>
                  <option value="descontraído">Descontraído</option>
                  <option value="íntimo">Íntimo</option>
                  <option value="emotivo">Emotivo</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="memory" className={labelClass}>
                  Memória / história
                </label>
                <textarea
                  id="memory"
                  {...register("memory")}
                  className={inputClass}
                  rows={3}
                  placeholder="Uma memória ou história especial com este convidado"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="shared_element" className={labelClass}>
                  Elemento compartilhado
                </label>
                <textarea
                  id="shared_element"
                  {...register("shared_element")}
                  className={inputClass}
                  rows={2}
                  placeholder="Algo em comum: hobby, viagem, experiência"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Status e observações */}
          <div>
            <h3 className={sectionHeadingClass}>Status e observações</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="invite_status" className={labelClass}>
                  Status do convite
                </label>
                <select id="invite_status" {...register("invite_status")} className={inputClass}>
                  {inviteStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="response_status" className={labelClass}>
                  Status da resposta
                </label>
                <select
                  id="response_status"
                  {...register("response_status")}
                  className={inputClass}
                >
                  {responseStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="notes" className={labelClass}>
                  Observações
                </label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  className={inputClass}
                  rows={3}
                  placeholder="Notas adicionais sobre o convidado"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit(onSubmit)}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar"}
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
  const [modalGuest, setModalGuest] = useState<GuestRead | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

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

  const openAddModal = () => {
    setModalGuest(undefined);
    setModalOpen(true);
  };

  const openEditModal = (guest: GuestRead) => {
    setModalGuest(guest);
    setModalOpen(true);
  };

  const handleModalSuccess = (saved: GuestRead) => {
    setModalOpen(false);
    if (modalGuest) {
      setGuests((prev) => prev.map((g) => (g.id === saved.id ? saved : g)));
    } else {
      setGuests((prev) => [...prev, saved]);
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
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
          >
            Adicionar convidado
          </button>
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
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
            >
              Adicionar primeiro convidado
            </button>
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
                        <button
                          onClick={() => openEditModal(guest)}
                          className="px-3 py-1 text-xs text-indigo-600 border border-indigo-300 rounded hover:bg-indigo-50 transition"
                        >
                          Editar
                        </button>
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

      {modalOpen && (
        <GuestFormModal
          guest={modalGuest}
          onClose={() => setModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

"use client";

import { chatWithGuest, createGuest, deleteGuest, listGuests, updateGuest } from "@/lib/api/guests";
import type {
  ChatMessage,
  ChatResponse,
  GuestCreate,
  GuestRead,
  GuestUpdate,
} from "@/lib/api/guests";
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
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

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
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-stone-200 dark:border-stone-700">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Confirmar exclusão
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          Tem certeza que deseja excluir{" "}
          <span className="font-medium text-stone-700 dark:text-stone-300">{guestName}</span>? Esta
          ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat invite modal
// ---------------------------------------------------------------------------

type ChatMessageUI = { role: "user" | "assistant"; content: string };

function InviteChatModal({
  guest,
  onClose,
  onGuestUpdated,
}: {
  guest: GuestRead;
  onClose: () => void;
  onGuestUpdated: (updated: GuestRead) => void;
}) {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteText, setInviteText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendTurn = useCallback(
    async (userText: string | null, currentMessages: ChatMessageUI[]) => {
      const historyToSend: ChatMessage[] = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setLoading(true);
      setError(null);

      try {
        const response: ChatResponse = await chatWithGuest(guest.id, historyToSend);
        const assistantMsg: ChatMessageUI = { role: "assistant", content: response.message };
        setMessages((prev) => [...prev, assistantMsg]);

        if (response.is_complete) {
          setInviteText(response.invite_text ?? null);
          if (response.fields_to_update) {
            const patch: GuestUpdate = response.fields_to_update as GuestUpdate;
            updateGuest(guest.id, patch)
              .then(onGuestUpdated)
              .catch(() => {
                // silent — guest update is best-effort
              });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao comunicar com o redator");
      } finally {
        setLoading(false);
        if (userText === null) {
          // opening turn — focus input after greeting
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    },
    [guest.id, onGuestUpdated]
  );

  // Trigger opening message once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    sendTurn(null, []);
  }, [sendTurn]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, inviteText, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || inviteText !== null) return;

    const userMsg: ChatMessageUI = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    await sendTurn(text, updatedMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async () => {
    if (!inviteText) return;
    await navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-stone-200 dark:border-stone-700">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200 dark:border-stone-700 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Redigindo convite para {guest.name}
            </h2>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              Redator de correspondências
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Chat area */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-br-sm"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Final invite card */}
          {inviteText && (
            <div className="mt-2 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Convite
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 border border-amber-300 dark:border-amber-700 rounded px-2 py-0.5 transition-colors"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-wrap p-4 leading-relaxed bg-white dark:bg-stone-900">
                {inviteText}
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-6 py-4 border-t border-stone-200 dark:border-stone-700">
          {inviteText ? (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
              Convite redigido. Feche para voltar à lista.
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Responda ao redator..."
                className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400 text-sm disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 text-sm text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-40 transition-colors"
              >
                Enviar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guest form — simplified for creation, full for editing
// ---------------------------------------------------------------------------

const inputClass =
  "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400 text-sm";
const labelClass = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";
const sectionHeadingClass =
  "text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3 pb-1 border-b border-stone-200 dark:border-stone-700";

// Create form

type CreateFormValues = {
  name: string;
  age_group: string;
  relationship_type: string;
  spouse_name: string;
  affiliates: { name: string }[];
};

function GuestCreateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (saved: GuestRead) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateFormValues>({
    defaultValues: {
      name: "",
      age_group: "",
      relationship_type: "",
      spouse_name: "",
      affiliates: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "affiliates" });

  const onSubmit = async (values: CreateFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const body: GuestCreate = {
        name: values.name,
        age_group: values.age_group || null,
        relationship_type: values.relationship_type || null,
        is_distant: false,
        invite_status: "pending",
        response_status: "pending",
      };
      const mainGuest = await createGuest(body);

      const secondaryCreations: Promise<GuestRead>[] = [];

      if (values.spouse_name.trim()) {
        secondaryCreations.push(
          createGuest({
            name: values.spouse_name.trim(),
            age_group: "adulto",
            relationship_type: "cônjuge",
            is_distant: false,
            invite_status: "pending",
            response_status: "pending",
          })
        );
      }

      for (const aff of values.affiliates) {
        if (aff.name.trim()) {
          secondaryCreations.push(
            createGuest({
              name: aff.name.trim(),
              relationship_type: "afiliado",
              is_distant: false,
              invite_status: "pending",
              response_status: "pending",
            })
          );
        }
      }

      await Promise.all(secondaryCreations);
      onSuccess(mainGuest);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar convidado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col border border-stone-200 dark:border-stone-700">
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Adicionar convidado
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 px-6 py-4 space-y-5"
        >
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400">
              {formError}
            </div>
          )}

          <div>
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
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="age_group" className={labelClass}>
              Faixa etária
            </label>
            <select id="age_group" {...register("age_group")} className={inputClass}>
              <option value="">Selecione...</option>
              <option value="criança">Criança</option>
              <option value="adulto">Adulto</option>
              <option value="idoso">Idoso</option>
            </select>
          </div>

          <div>
            <label htmlFor="relationship_type" className={labelClass}>
              Relação com o convidante
            </label>
            <select
              id="relationship_type"
              {...register("relationship_type")}
              className={inputClass}
            >
              <option value="">Selecione...</option>
              <option value="familiar">Familiar</option>
              <option value="amigo">Amigo</option>
              <option value="colega">Colega</option>
              <option value="conhecido">Conhecido</option>
            </select>
          </div>

          <div>
            <label htmlFor="spouse_name" className={labelClass}>
              Cônjuge
            </label>
            <input
              id="spouse_name"
              type="text"
              {...register("spouse_name")}
              className={inputClass}
              placeholder="Nome do cônjuge (opcional)"
            />
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              Será adicionado como convidado separado.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${labelClass} mb-0`}>Afiliados</label>
              <button
                type="button"
                onClick={() => append({ name: "" })}
                className="text-xs text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-600 rounded px-2 py-0.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                + Adicionar
              </button>
            </div>
            {fields.length === 0 && (
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Filhos ou parentes próximos que também serão convidados.
              </p>
            )}
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    type="text"
                    {...register(`affiliates.${index}.name`)}
                    className={inputClass}
                    placeholder="Nome do afiliado"
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-2 py-1 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    aria-label="Remover afiliado"
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit(onSubmit)}
            className="px-4 py-2 text-sm text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit form (full fields)

type EditFormValues = {
  name: string;
  nickname: string;
  age_group: string;
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

function GuestEditModal({
  guest,
  onClose,
  onSuccess,
}: {
  guest: GuestRead;
  onClose: () => void;
  onSuccess: (saved: GuestRead) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormValues>({
    defaultValues: {
      name: guest.name,
      nickname: guest.nickname ?? "",
      age_group: guest.age_group ?? "",
      relationship_type: guest.relationship_type ?? "",
      city: guest.city ?? "",
      state: guest.state ?? "",
      is_distant: guest.is_distant,
      friendship_level: guest.friendship_level ?? "",
      intimacy: guest.intimacy ?? "",
      contact_frequency: guest.contact_frequency ?? "",
      last_contact_medium: guest.last_contact_medium ?? "",
      ideal_tone: guest.ideal_tone ?? "",
      memory: guest.memory ?? "",
      shared_element: guest.shared_element ?? "",
      invite_status: normalizeInviteStatus(guest.invite_status),
      response_status: normalizeResponseStatus(guest.response_status),
      notes: guest.notes ?? "",
    },
  });

  const onSubmit = async (values: EditFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const nullIfEmpty = (v: string) => v.trim() || null;
      const body: GuestUpdate = {
        name: values.name,
        age_group: nullIfEmpty(values.age_group),
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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar convidado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-stone-200 dark:border-stone-700">
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Editar convidado
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-xl leading-none"
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
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400">
              {formError}
            </div>
          )}

          <div>
            <h3 className={sectionHeadingClass}>Dados pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="edit-name" className={labelClass}>
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  {...register("name", { required: "Nome é obrigatório" })}
                  className={inputClass}
                  placeholder="Nome completo"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="edit-nickname" className={labelClass}>
                  Apelido
                </label>
                <input
                  id="edit-nickname"
                  type="text"
                  {...register("nickname")}
                  className={inputClass}
                  placeholder="Como é chamado(a)"
                />
              </div>
              <div>
                <label htmlFor="edit-age_group" className={labelClass}>
                  Faixa etária
                </label>
                <select id="edit-age_group" {...register("age_group")} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="criança">Criança</option>
                  <option value="adulto">Adulto</option>
                  <option value="idoso">Idoso</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-relationship_type" className={labelClass}>
                  Tipo de relacionamento
                </label>
                <input
                  id="edit-relationship_type"
                  type="text"
                  {...register("relationship_type")}
                  className={inputClass}
                  placeholder="Ex: amigo, familiar, colega"
                />
              </div>
              <div>
                <label htmlFor="edit-city" className={labelClass}>
                  Cidade
                </label>
                <input
                  id="edit-city"
                  type="text"
                  {...register("city")}
                  className={inputClass}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label htmlFor="edit-state" className={labelClass}>
                  Estado
                </label>
                <input
                  id="edit-state"
                  type="text"
                  {...register("state")}
                  className={inputClass}
                  placeholder="UF"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="edit-is_distant"
                  type="checkbox"
                  {...register("is_distant")}
                  className="h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-500"
                />
                <label
                  htmlFor="edit-is_distant"
                  className="text-sm text-stone-600 dark:text-stone-400"
                >
                  Convidado distante (mora longe ou contato raro)
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className={sectionHeadingClass}>Contexto para IA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-friendship_level" className={labelClass}>
                  Nível de amizade
                </label>
                <input
                  id="edit-friendship_level"
                  type="text"
                  {...register("friendship_level")}
                  className={inputClass}
                  placeholder="Ex: melhor amigo, conhecido"
                />
              </div>
              <div>
                <label htmlFor="edit-intimacy" className={labelClass}>
                  Intimidade
                </label>
                <select id="edit-intimacy" {...register("intimacy")} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="muito próximo">Muito próximo</option>
                  <option value="próximo">Próximo</option>
                  <option value="médio">Médio</option>
                  <option value="distante">Distante</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-contact_frequency" className={labelClass}>
                  Frequência de contato
                </label>
                <select
                  id="edit-contact_frequency"
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
                <label htmlFor="edit-last_contact_medium" className={labelClass}>
                  Último meio de contato
                </label>
                <select
                  id="edit-last_contact_medium"
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
                <label htmlFor="edit-ideal_tone" className={labelClass}>
                  Tom ideal
                </label>
                <select id="edit-ideal_tone" {...register("ideal_tone")} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="formal">Formal</option>
                  <option value="descontraído">Descontraído</option>
                  <option value="íntimo">Íntimo</option>
                  <option value="emotivo">Emotivo</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-memory" className={labelClass}>
                  Memória / história
                </label>
                <textarea
                  id="edit-memory"
                  {...register("memory")}
                  className={inputClass}
                  rows={3}
                  placeholder="Uma memória ou história especial com este convidado"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-shared_element" className={labelClass}>
                  Elemento compartilhado
                </label>
                <textarea
                  id="edit-shared_element"
                  {...register("shared_element")}
                  className={inputClass}
                  rows={2}
                  placeholder="Algo em comum: hobby, viagem, experiência"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className={sectionHeadingClass}>Status e observações</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-invite_status" className={labelClass}>
                  Status do convite
                </label>
                <select
                  id="edit-invite_status"
                  {...register("invite_status")}
                  className={inputClass}
                >
                  {inviteStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-response_status" className={labelClass}>
                  Status da resposta
                </label>
                <select
                  id="edit-response_status"
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
                <label htmlFor="edit-notes" className={labelClass}>
                  Observações
                </label>
                <textarea
                  id="edit-notes"
                  {...register("notes")}
                  className={inputClass}
                  rows={3}
                  placeholder="Notas adicionais sobre o convidado"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit(onSubmit)}
            className="px-4 py-2 text-sm text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GuestsPage() {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const [guests, setGuests] = useState<GuestRead[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuestRead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editGuest, setEditGuest] = useState<GuestRead | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [chatGuest, setChatGuest] = useState<GuestRead | null>(null);

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

  const handleCreateSuccess = (saved: GuestRead) => {
    setCreateOpen(false);
    setGuests((prev) => [...prev, saved]);
    fetchGuests(); // refresh to pick up cônjuge/afiliados too
  };

  const handleEditSuccess = (saved: GuestRead) => {
    setEditGuest(null);
    setGuests((prev) => prev.map((g) => (g.id === saved.id ? saved : g)));
  };

  const handleGuestUpdatedByChat = (updated: GuestRead) => {
    setGuests((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400 dark:text-stone-500 text-sm">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <nav className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight"
              >
                Wedding Inviter
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Painel
              </Link>
              <Link
                href="/dashboard/guests"
                className="text-sm font-medium text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 pb-0.5"
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Convidados
          </h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors text-sm font-medium"
          >
            Adicionar convidado
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loadingGuests ? (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center text-stone-400 dark:text-stone-500 text-sm">
            Carregando convidados...
          </div>
        ) : guests.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
            <p className="text-stone-400 dark:text-stone-500 text-sm mb-4">
              Nenhum convidado cadastrado ainda.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors text-sm font-medium"
            >
              Adicionar primeiro convidado
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
              <thead className="bg-stone-50 dark:bg-stone-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Relação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Faixa etária
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Convite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Resposta
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-stone-900 divide-y divide-stone-200 dark:divide-stone-700">
                {guests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {guest.name}
                      </div>
                      {guest.nickname && (
                        <div className="text-xs text-stone-400 dark:text-stone-500">
                          {guest.nickname}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                      {guest.relationship_type || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                      {guest.age_group || "—"}
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
                          onClick={() => setChatGuest(guest)}
                          className="px-3 py-1 text-xs text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                        >
                          Redigir convite
                        </button>
                        <button
                          onClick={() => setEditGuest(guest)}
                          className="px-3 py-1 text-xs text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-600 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(guest)}
                          className="px-3 py-1 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
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

      {createOpen && (
        <GuestCreateModal onClose={() => setCreateOpen(false)} onSuccess={handleCreateSuccess} />
      )}

      {editGuest && (
        <GuestEditModal
          guest={editGuest}
          onClose={() => setEditGuest(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {chatGuest && (
        <InviteChatModal
          guest={chatGuest}
          onClose={() => setChatGuest(null)}
          onGuestUpdated={handleGuestUpdatedByChat}
        />
      )}
    </div>
  );
}

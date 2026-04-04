const inviteStatusMetadata = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
  sent: { label: "Enviado", className: "bg-green-100 text-green-800" },
} as const;

const responseStatusMetadata = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmado", className: "bg-green-100 text-green-800" },
  absent: { label: "Ausente", className: "bg-red-100 text-red-800" },
  uncertain: { label: "Incerto", className: "bg-orange-100 text-orange-800" },
} as const;

export type InviteStatus = keyof typeof inviteStatusMetadata;
export type ResponseStatus = keyof typeof responseStatusMetadata;

const inviteStatusAliases: Record<string, InviteStatus> = {
  enviado: "sent",
};

const responseStatusAliases: Record<string, ResponseStatus> = {
  confirmado: "confirmed",
  ausente: "absent",
  incerto: "uncertain",
};

export const inviteStatusOptions = Object.entries(inviteStatusMetadata).map(([value, meta]) => ({
  value: value as InviteStatus,
  label: meta.label,
}));

export const responseStatusOptions = Object.entries(responseStatusMetadata).map(
  ([value, meta]) => ({
    value: value as ResponseStatus,
    label: meta.label,
  })
);

export function normalizeInviteStatus(status: string | null | undefined): InviteStatus {
  if (!status) return "pending";
  if (status in inviteStatusMetadata) return status as InviteStatus;
  return inviteStatusAliases[status] ?? "pending";
}

export function normalizeResponseStatus(status: string | null | undefined): ResponseStatus {
  if (!status) return "pending";
  if (status in responseStatusMetadata) return status as ResponseStatus;
  return responseStatusAliases[status] ?? "pending";
}

export function getInviteStatusMeta(status: string | null | undefined) {
  const normalized = normalizeInviteStatus(status);
  return {
    value: normalized,
    ...inviteStatusMetadata[normalized],
  };
}

export function getResponseStatusMeta(status: string | null | undefined) {
  const normalized = normalizeResponseStatus(status);
  return {
    value: normalized,
    ...responseStatusMetadata[normalized],
  };
}

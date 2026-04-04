import { authenticatedClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import type { components } from "@/types/api";

export type GuestRead = components["schemas"]["GuestRead"];
export type GuestCreate = components["schemas"]["GuestCreate"];
export type GuestUpdate = components["schemas"]["GuestUpdate"];
export type InviteMessageVariation = components["schemas"]["InviteMessageVariation"];
export type InviteMessageResponse = components["schemas"]["InviteMessageResponse"];

function extractErrorMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "detail" in error) {
    const detail = (error as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return fallbackMessage;
}

export async function listGuests(): Promise<GuestRead[]> {
  const { data, error } = await authenticatedClient.GET("/guests");
  if (error) throw new Error(extractErrorMessage(error, "Failed to load guests"));
  return data.guests;
}

export async function createGuest(body: GuestCreate): Promise<GuestRead> {
  const { data, error } = await authenticatedClient.POST("/guests", { body });
  if (error) throw new Error(extractErrorMessage(error, "Failed to create guest"));
  return data;
}

export async function updateGuest(guestId: string, body: GuestUpdate): Promise<GuestRead> {
  const { data, error } = await authenticatedClient.PATCH("/guests/{guest_id}", {
    params: { path: { guest_id: guestId } },
    body,
  });
  if (error) throw new Error(extractErrorMessage(error, "Failed to update guest"));
  return data;
}

export async function deleteGuest(guestId: string): Promise<void> {
  const { error } = await authenticatedClient.DELETE("/guests/{guest_id}", {
    params: { path: { guest_id: guestId } },
  });
  if (error) throw new Error(extractErrorMessage(error, "Failed to delete guest"));
}

export async function generateInviteMessage(guestId: string): Promise<InviteMessageResponse> {
  const { data, error } = await authenticatedClient.POST("/guests/{guest_id}/invite-message", {
    params: { path: { guest_id: guestId } },
  });
  if (error) throw new Error(extractErrorMessage(error, "Failed to generate invite message"));
  return data;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatResponse = {
  message: string;
  is_complete: boolean;
  invite_text: string | null;
  fields_to_update: Record<string, string | null> | null;
};

export async function chatWithGuest(
  guestId: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`/api/guests/${guestId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "Falha ao comunicar com o redator"));
  }
  return res.json() as Promise<ChatResponse>;
}

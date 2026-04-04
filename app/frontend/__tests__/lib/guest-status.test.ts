import { describe, expect, it } from "vitest";
import {
  getInviteStatusMeta,
  getResponseStatusMeta,
  normalizeInviteStatus,
  normalizeResponseStatus,
} from "@/lib/guest-status";

describe("guest status helpers", () => {
  it("normalizes legacy localized values to canonical API codes", () => {
    expect(normalizeInviteStatus("enviado")).toBe("sent");
    expect(normalizeResponseStatus("confirmado")).toBe("confirmed");
    expect(normalizeResponseStatus("ausente")).toBe("absent");
    expect(normalizeResponseStatus("incerto")).toBe("uncertain");
  });

  it("falls back to pending for missing or unknown values", () => {
    expect(normalizeInviteStatus(undefined)).toBe("pending");
    expect(normalizeInviteStatus("desconhecido")).toBe("pending");
    expect(normalizeResponseStatus(null)).toBe("pending");
    expect(normalizeResponseStatus("desconhecido")).toBe("pending");
  });

  it("returns translated labels for canonical status codes", () => {
    expect(getInviteStatusMeta("sent")).toMatchObject({
      value: "sent",
      label: "Enviado",
    });

    expect(getResponseStatusMeta("confirmed")).toMatchObject({
      value: "confirmed",
      label: "Confirmado",
    });
  });
});

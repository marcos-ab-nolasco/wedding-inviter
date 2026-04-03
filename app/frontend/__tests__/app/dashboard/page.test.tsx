import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GuestRead } from "@/lib/api/guests";
import { useAuth } from "@/hooks/useAuth";
import { listGuests } from "@/lib/api/guests";
import DashboardPage from "@/src/app/dashboard/page";

const push = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/guests", () => ({
  listGuests: vi.fn(),
}));

function makeGuest(
  id: string,
  responseStatus: GuestRead["response_status"],
  inviteStatus: GuestRead["invite_status"] = "pending"
): GuestRead {
  return {
    id,
    wedding_id: "wedding-1",
    name: `Guest ${id}`,
    is_distant: false,
    invite_status: inviteStatus,
    response_status: responseStatus,
    created_at: "2026-03-29T12:00:00Z",
    updated_at: "2026-03-29T12:00:00Z",
  };
}

function getStatCard(label: string) {
  const card = screen.getByText(label).closest("div");
  if (!card) {
    throw new Error(`Stat card not found for label: ${label}`);
  }
  return card;
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReset();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        email: "maria@example.com",
        full_name: "Maria Silva",
        created_at: "2026-03-29T12:00:00Z",
        updated_at: "2026-03-29T12:00:00Z",
      },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn().mockResolvedValue(undefined),
      login: vi.fn(),
      register: vi.fn(),
      refreshAuth: vi.fn(),
      initializeSession: vi.fn(),
      clearError: vi.fn(),
      accessToken: null,
      error: null,
    } as ReturnType<typeof useAuth>);
  });

  it("computes summary cards from canonical API response_status codes", async () => {
    vi.mocked(listGuests).mockResolvedValue([
      makeGuest("1", "confirmed", "sent"),
      makeGuest("2", "absent"),
      makeGuest("3", "pending"),
      makeGuest("4", "uncertain"),
      makeGuest("5", "confirmed"),
    ]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(within(getStatCard("Total de convidados")).getByText("5")).toBeInTheDocument();
    });

    expect(within(getStatCard("Confirmados")).getByText("2")).toBeInTheDocument();
    expect(within(getStatCard("Aguardando resposta")).getByText("1")).toBeInTheDocument();
    expect(within(getStatCard("Ausentes")).getByText("1")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error state instead of zeroed statistics when guest loading fails", async () => {
    vi.mocked(listGuests).mockRejectedValue(new Error("Falha ao carregar convidados"));

    render(<DashboardPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar as estatísticas agora. Falha ao carregar convidados"
    );

    expect(within(getStatCard("Total de convidados")).getByText("N/D")).toBeInTheDocument();
    expect(within(getStatCard("Confirmados")).getByText("N/D")).toBeInTheDocument();
    expect(within(getStatCard("Confirmados")).queryByText("0")).not.toBeInTheDocument();
    expect(within(getStatCard("Ausentes")).queryByText("0")).not.toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";
import DashboardApp from "./DashboardApp";

vi.mock("../hooks/useAuth");

vi.mock("../services/courseService", () => ({ listCourses: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/assignmentService", () => ({ listAssignments: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/workItemService", () => ({ listWorkItemsForStudent: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/decompositionAttemptService", () => ({ listForStudent: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/reflectionService", () => ({ listForStudent: vi.fn().mockResolvedValue([]) }));

// This test environment's jsdom `window.localStorage` doesn't implement
// the Storage interface (unrelated Node/jsdom flag collision — verified
// setItem/getItem/clear are all missing here even though real browsers
// and the deployed app have a working one). Stub a minimal in-memory
// replacement so DashboardApp's mode-persistence code has something real
// to read/write.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  vi.mocked(useAuth).mockReset();
  vi.stubGlobal("localStorage", createMemoryStorage());
});

describe("DashboardApp", () => {
  it("shows the login page when there is no authenticated user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<DashboardApp />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  it("reuses the student's own session and defaults to Coach Mode Overview", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "student@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<DashboardApp />);

    expect(await screen.findByRole("heading", { name: /^overview$/i })).toBeInTheDocument();
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coach" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches screens via the sidebar nav", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "student@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    const userEventInstance = userEvent.setup();

    render(<DashboardApp />);
    await screen.findByRole("heading", { name: /^overview$/i });
    const nav = screen.getByRole("navigation", { name: "Dashboard" });

    await userEventInstance.click(within(nav).getByRole("button", { name: "Reflections" }));

    expect(await screen.findByRole("heading", { name: /^reflections$/i })).toBeInTheDocument();
  });

  it("switching to Parent Mode hides Diagnostics and Timeline nav, and resets to Overview", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "student@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    const userEventInstance = userEvent.setup();

    render(<DashboardApp />);
    await screen.findByRole("heading", { name: /^overview$/i });
    const nav = screen.getByRole("navigation", { name: "Dashboard" });
    await userEventInstance.click(within(nav).getByRole("button", { name: "Evidence Timeline" }));
    await screen.findByRole("heading", { name: /evidence timeline/i });

    await userEventInstance.click(screen.getByRole("button", { name: "Parent" }));

    expect(await screen.findByRole("heading", { name: /how things are going/i })).toBeInTheDocument();
    expect(within(nav).queryByRole("button", { name: "Evidence Timeline" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("button", { name: "Diagnostics" })).not.toBeInTheDocument();
  });

  it("shows Diagnostics nav only in Diagnostic Mode", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "student@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    const userEventInstance = userEvent.setup();

    render(<DashboardApp />);
    await screen.findByRole("heading", { name: /^overview$/i });
    const nav = screen.getByRole("navigation", { name: "Dashboard" });

    expect(within(nav).queryByRole("button", { name: "Diagnostics" })).not.toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: "Diagnostic" }));

    expect(await within(nav).findByRole("button", { name: "Diagnostics" })).toBeInTheDocument();
  });

  it("persists the selected mode to localStorage and restores it on remount", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "student@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    const userEventInstance = userEvent.setup();

    const { unmount } = render(<DashboardApp />);
    await screen.findByRole("heading", { name: /^overview$/i });
    await userEventInstance.click(screen.getByRole("button", { name: "Diagnostic" }));
    await waitFor(() => expect(window.localStorage.getItem("osb-dashboard-mode")).toBe("diagnostic"));
    unmount();

    render(<DashboardApp />);
    await screen.findByRole("heading", { name: /^overview$/i });
    expect(screen.getByRole("button", { name: "Diagnostic" })).toHaveAttribute("aria-pressed", "true");
  });

  it("signs out via the header button", async () => {
    const signOut = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "student@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut,
    });
    const userEventInstance = userEvent.setup();

    render(<DashboardApp />);
    await screen.findByRole("heading", { name: /^overview$/i });

    await userEventInstance.click(screen.getByRole("button", { name: /sign out/i }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

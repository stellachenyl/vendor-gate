import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NcrDetailPage from "@/app/ncrs/[ncrId]/page";
import { RoleProvider, useRole } from "@/lib/role-context";
import { ToastProvider } from "@/components/ui/Toast";

const mockParams = new Map<string, string>();

jest.mock("next/navigation", () => ({
  useParams: () => ({ ncrId: mockParams.get("ncrId") }),
}));

function RoleSwitcher() {
  const { setRole } = useRole();
  return (
    <button type="button" onClick={() => setRole("Supplier User")}>
      become-supplier-user
    </button>
  );
}

describe("NCR detail page integration", () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date("2026-08-24T10:00:00Z"),
      doNotFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "queueMicrotask", "performance"],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockParams.clear();
  });

  function renderDetail(ncrId: string) {
    mockParams.set("ncrId", ncrId);
    return render(
      <ToastProvider>
        <RoleProvider>
          <RoleSwitcher />
          <NcrDetailPage />
        </RoleProvider>
      </ToastProvider>,
    );
  }

  it("renders the header block with identity, linkage and formatted metrics", () => {
    renderDetail("NCR-2608");

    expect(screen.getAllByText("NCR-2608").length).toBeGreaterThan(0);
    expect(screen.getByText(/Flange edge cracking/i)).toBeInTheDocument();
    expect(screen.getByText(/Qty affected/)).toBeInTheDocument();
    expect(screen.getByText("$18,500")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument(); // days open counter
    // Engineer appears in the header and in the 8D team roster.
    expect(screen.getAllByText("L. Brennan").length).toBeGreaterThan(0);
  });

  it("renders the full D1–D8 tracker with completed/current/pending states", () => {
    const { container } = renderDetail("NCR-2608");

    expect(
      screen.getByRole("group", { name: /8D progress: step 3 of 8, containment/ }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-state='completed']")).toHaveLength(2);
    expect(container.querySelectorAll("[data-state='current']")).toHaveLength(1);
    expect(container.querySelectorAll("[data-state='pending']")).toHaveLength(5);
    // The current step is D3 (containment) and is announced to AT.
    const containmentLabel = screen.getByText("Containment").closest("li")!;
    expect(containmentLabel.querySelector("[aria-current='step']")).not.toBeNull();
  });

  it("lists containment evidence files for traceability", () => {
    renderDetail("NCR-2608");
    expect(screen.getAllByText(/Quarantine cage Q-3 photo\.jpg/i).length).toBeGreaterThan(0);
  });

  it("flags overdue corrective actions and shows statuses in the plan table", () => {
    renderDetail("NCR-2601"); // CA-2 due 2026-08-22, In Progress → overdue at 24 Aug

    expect(screen.getByText(/Revise work instruction WI-6415/i)).toBeInTheDocument();
    const overdueCell = screen.getByText(/22 Aug 2026/);
    expect(overdueCell.className).toContain("text-red-600");
    expect(screen.getAllByText("Done").length).toBeGreaterThan(0);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Planned").length).toBeGreaterThan(0);
  });

  it("enforces verification-before-closure on the sign-off chain (Quality Manager)", async () => {
    const user = userEvent.setup();
    renderDetail("NCR-2608");

    const close = screen.getByRole("button", { name: /Close NCR/i });
    expect(close).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Record Verification/i }));
    expect(await screen.findByText(/Verified by you \(session draft\)/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Close NCR/i })).toBeEnabled();
  });

  it("shows recorded sign-offs instead of buttons on a closed NCR", () => {
    renderDetail("NCR-2594");

    // Sign-off names live inside their dedicated boxes.
    const verificationBox = screen.getByText(/Verification Sign-off/i).closest("div")!;
    expect(within(verificationBox).getByText("M. Delgado")).toBeInTheDocument();
    const closureBox = screen.getByText(/Closure Sign-off/i).closest("div")!;
    expect(within(closureBox).getByText("L. Brennan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Close NCR/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Record Verification/i })).not.toBeInTheDocument();
  });

  it("denies root cause editing and sign-off to Supplier Users (authorization)", async () => {
    const user = userEvent.setup();
    renderDetail("NCR-2608");

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));

    expect(screen.getByRole("button", { name: /Save Root Cause/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Record Verification/i })).toBeDisabled();
  });

  it("orders the activity log newest-first for operational review", () => {
    renderDetail("NCR-2608");

    const aside = screen.getByLabelText(/Activity log timeline/i);
    const dates = within(aside)
      .getAllByText(/\d{2} \w{3} \d{4}/)
      .map((p) => p.textContent);
    expect(dates).toEqual([
      "14 Aug 2026",
      "13 Aug 2026",
      "12 Aug 2026",
      "12 Aug 2026",
    ]);
  });

  it("shows a not-found fallback for an unknown NCR id", () => {
    renderDetail("NCR-DOES-NOT-EXIST");
    expect(screen.getByText("NCR not found")).toBeInTheDocument();
  });
});


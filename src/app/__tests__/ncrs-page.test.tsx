import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NcrsPage from "@/app/ncrs/page";
import { RoleProvider, useRole } from "@/lib/role-context";
import { ToastProvider } from "@/components/ui/Toast";

function RoleSwitcher() {
  const { role, setRole } = useRole();
  return (
    <button type="button" onClick={() => setRole("Supplier User")}>
      become-supplier-user (currently {role})
    </button>
  );
}

// `?new=1&supplier=…` is read via useSearchParams; the test seeds it through
// a stubbed match since history is not available in jsdom.
const mockParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockParams,
  useRouter: () => ({ push: jest.fn() }),
}));

describe("NCR management page integration", () => {
  function renderPage() {
    // Mirrors the app composition: root layout supplies both providers.
    return render(
      <ToastProvider>
        <RoleProvider>
          <RoleSwitcher />
          <NcrsPage />
        </RoleProvider>
      </ToastProvider>,
    );
  }

  it("lists all NCR reports for the Quality Manager sorted newest first", () => {
    renderPage();
    expect(screen.getAllByRole("article")).toHaveLength(8);
    // Newest (2611, raised 2026-08-20) before oldest closed report.
    const ids = screen
      .getAllByRole("article")
      .map((a) => a.querySelector("h3")?.textContent);
    expect(ids[0]).toBe("NCR-2611");
  });

  it("filters by severity", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText(/Filter by severity/i), ["Critical"]);
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2); // NCR-2608, NCR-2605 are the Critical fixtures
    for (const article of articles) {
      expect(within(article).getAllByText("Critical").length).toBeGreaterThan(0);
    }
  });

  it("filters by status and supplier together (compound filters)", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText(/Filter by status/i), ["Verified"]);
    expect(screen.getAllByRole("article")).toHaveLength(1);

    await user.selectOptions(screen.getByLabelText(/Filter by supplier/i), ["SUP-010"]);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText(/Anodic coating thickness/i)).toBeInTheDocument();
  });

  it("filters by raise-date range with inclusive bounds", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^Raised from date$/i), "2026-08-01");
    await user.type(screen.getByLabelText(/^Raised to date$/i), "2026-08-20");

    const articles = screen.getAllByRole("article");
    // Raised in Aug 1–20: NCR-2608(08-12), NCR-2605(08-06), NCR-2611(08-20), NCR-2609(08-15)
    expect(articles).toHaveLength(4);
  });

  it("shows an empty-state message when filters exclude everything", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText(/Filter by severity/i), ["Observation"]);
    await user.selectOptions(screen.getByLabelText(/Filter by supplier/i), ["SUP-001"]);

    expect(screen.getByRole("status")).toHaveTextContent(
      /No NCRs match the current filters/i,
    );
  });

  it("opens the multi-step wizard from the New NCR button and closes without side effects on cancel", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /\+ New NCR/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName(/Raise Nonconformance Report/i);

    // Step 1 gate: Next disabled until required D2 fields are complete.
    const next = within(dialog).getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(8);
  });

  it("walks the three wizard steps and submits an NCR", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /\+ New NCR/i }));
    const dialog = screen.getByRole("dialog");

    await user.selectOptions(within(dialog).getByLabelText(/^Supplier$/i), ["SUP-004"]);
    await user.type(within(dialog).getByLabelText(/^Part Number$/i), "TNX-3320-D");
    await user.type(
      within(dialog).getByLabelText(/Defect Description/i),
      "Flange cracking found during incoming dimensional sampling.",
    );
    await user.selectOptions(within(dialog).getByLabelText(/^Severity$/i), ["Major"]);

    const next = within(dialog).getByRole("button", { name: "Next" });
    expect(next).toBeEnabled();
    await user.click(next);
    // Step 2: containment + root cause category + team.
    await user.click(within(dialog).getByRole("button", { name: "Next" }));

    // Step 3: review shows the entered data.
    expect(within(dialog).getByText("Ironbridge Stampings")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Submit NCR" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(
      /NCR submitted and routed/i,
    );
  });

  it("scopes Supplier Users to only their own supplier's NCR records (authorization)", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));

    // The demo Supplier User account (SUP-003) owns exactly one fixture NCR.
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(1);
    expect(articles[0]).toHaveTextContent("NCR-2594");
    // Cross-supplier records must be absent — no cross-tenant leakage.
    expect(screen.queryByText("NCR-2608")).not.toBeInTheDocument();
    expect(screen.queryByText("NCR-2605")).not.toBeInTheDocument();
  });

  it("auto-opens the wizard when arriving from ?new=1 with supplier preselected", () => {
    mockParams.set("new", "1");
    mockParams.set("supplier", "SUP-004");
    renderPage();

    const dialog = screen.getByRole("dialog");
    const supplierSelect = within(dialog).getByLabelText(/^Supplier$/i) as HTMLSelectElement;
    expect(supplierSelect.value).toBe("SUP-004");
    mockParams.delete("new");
    mockParams.delete("supplier");
  });
});

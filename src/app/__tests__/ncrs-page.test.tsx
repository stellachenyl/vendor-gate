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

describe("NCRs page integration", () => {
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

  it("lists all NCR reports for the Quality Manager", () => {
    renderPage();
    // 8 fixture reports are visible to the manager.
    expect(screen.getAllByRole("article")).toHaveLength(8);
  });

  it("summarizes the pipeline counts per status on the status board", () => {
    const { container } = renderPage();

    const board = screen.getByRole("region", { name: /NCR pipeline/i });
    void container;
    expect(within(board).getByText("Open")).toBeInTheDocument();

    // Closed = NCR-2594 + NCR-2603.
    const closedButton = within(board)
      .getAllByRole("button")
      .find((b) => b.textContent === "Closed2");
    expect(closedButton).toBeDefined();
    // Investigating = NCR-2608 + NCR-2609.
    const investigating = within(board)
      .getAllByRole("button")
      .find((b) => b.textContent === "Investigating2");
    expect(investigating).toBeDefined();
  });

  it("filters the report list when a status is selected and restores on re-click", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /^Open/ }));
    let articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(1);
    expect(within(articles[0]!).getByText("NCR-2611")).toBeInTheDocument();

    // Toggle off returns the full list (idempotent filter reset).
    await user.click(screen.getByRole("button", { name: /^Open/ }));
    articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(8);
  });

  it("opens the New NCR modal and closes it without side effects on cancel", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /\+ New NCR/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName(/Raise Nonconformance Report/i);

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(8);
  });

  it("scopes Supplier Users to only their own supplier's NCR records (authorization)", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));

    const articles = screen.getAllByRole("article");
    // The demo Supplier User account (SUP-003, Cascade Polymer Solutions)
    // owns exactly one fixture NCR.
    expect(articles).toHaveLength(1);
    expect(articles[0]).toHaveTextContent("NCR-2594");
    // Cross-supplier records must be absent — no cross-tenant leakage.
    expect(screen.queryByText("NCR-2608")).not.toBeInTheDocument();
    expect(screen.queryByText("NCR-2605")).not.toBeInTheDocument();
    // Status-board counts are re-scoped for the supplier view too.
    const board = screen.getByRole("region", { name: /NCR pipeline/i });
    expect(
      within(board)
        .getAllByRole("button")
        .find((b) => b.textContent === "Open0"),
    ).toBeDefined();
  });

  it("shows an empty-state message when a supplier has no NCRs in a filtered status", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));
    // Cascade's only status is Closed; filtering to Open yields an empty list.
    await user.click(screen.getByRole("button", { name: /^Open/ }));

    expect(
      screen.getByText(/No NCRs match the selected filter/i),
    ).toBeInTheDocument();
  });
});

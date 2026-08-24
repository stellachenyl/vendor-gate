import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentsPage from "@/app/documents/page";
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

describe("Documents page integration", () => {
  function renderPage() {
    return render(
      <ToastProvider>
        <RoleProvider>
          <RoleSwitcher />
          <DocumentsPage />
        </RoleProvider>
      </ToastProvider>,
    );
  }

  it("lists the controlled document register for the Quality Manager", () => {
    renderPage();

    // 20 fixture documents; table pages 8 per page but caption shows the total.
    expect(screen.getByText(/Controlled Documents \(20\)/i)).toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBeGreaterThan(2);
  });

  it("exposes Approve/Reject only on Pending rows for the Quality Manager", () => {
    renderPage();

    const approveButtons = screen.getAllByRole("button", { name: "Approve" });
    expect(approveButtons).toHaveLength(3); // Pending fixtures landing on page 1

    const rows = screen.getAllByRole("row").filter((r) =>
      r.textContent?.includes("Approved"),
    );
    for (const row of rows) {
      expect(within(row).queryByRole("button", { name: "Approve" })).toBeNull();
    }
  });

  it("hides approval actions entirely from Supplier Users (authorization)", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));

    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });

  it("approves a pending document and persists the status change in the list", async () => {
    const user = userEvent.setup();
    renderPage();

    const pendingRow = screen
      .getAllByRole("row")
      .find((r) => r.textContent?.includes("PPAP Level 3 Submission"))!;
    await user.click(within(pendingRow).getByRole("button", { name: "Approve" }));

    // Status flips in place (session persistence) and action buttons disappear.
    expect(await screen.findByRole("status")).toHaveTextContent(/marked approved/i);
    const rows = screen.getAllByRole("row");
    const updatedRow = rows.find((r) => r.textContent?.includes("PPAP Level 3 Submission"))!;
    expect(updatedRow).toHaveTextContent("Approved");
    expect(within(updatedRow).queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("rejects a pending document with feedback", async () => {
    const user = userEvent.setup();
    renderPage();

    const pendingRow = screen
      .getAllByRole("row")
      .find((r) => r.textContent?.includes("PFMEA - Spindle Journal Pin"))!;
    await user.click(within(pendingRow).getByRole("button", { name: "Reject" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/marked rejected/i);
  });

  it("filters by document type", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText(/Filter by document type/i), [
      "Audit Report",
    ]);

    const body = document.querySelector("tbody")!;
    expect(body.textContent).toContain("Audit Report AUD-2628");
    expect(body.textContent).not.toContain("ISO 9001:2015 Certificate");
  });

  it("combines type + status filters (compound)", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText(/Filter by document type/i), ["PPAP"]);
    await user.selectOptions(screen.getByLabelText(/Filter by approval status/i), ["Rejected"]);

    expect(screen.getByText(/Controlled Documents \(1\)/i)).toBeInTheDocument();
    expect(document.querySelector("tbody")!.textContent).toContain(
      "PPAP Interim Approval",
    );
  });

  it("opens the preview modal with metadata and approval actions for pending docs", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText(/PPAP Level 3 Submission/i));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("DOC-101");
    expect(dialog).toHaveTextContent("Ironbridge Stampings");
    expect(dialog).toHaveTextContent("Rev C");
    expect(within(dialog).getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("omits approval actions from the preview modal for Supplier Users", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));
    // Open a document the supplier account actually owns (SUP-003).
    await user.click(screen.getByText(/Control Plan - Actuator Housing Cover/i));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Approve" })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Reject" })).toBeNull();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SupplierDetailPage from "@/app/suppliers/[supplierId]/page";
import { ToastProvider } from "@/components/ui/Toast";
import { RoleProvider, useRole } from "@/lib/role-context";

const mockParams = new Map<string, string>();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ supplierId: mockParams.get("supplierId") }),
  useRouter: () => ({ push: mockPush }),
}));

function RoleSwitcher() {
  const { setRole } = useRole();
  return (
    <button type="button" onClick={() => setRole("Supplier User")}>
      become-supplier-user
    </button>
  );
}

describe("Supplier detail page integration", () => {
  beforeEach(() => {
    mockParams.clear();
    mockPush.mockClear();
  });

  function renderDetail(supplierId: string) {
    mockParams.set("supplierId", supplierId);
    return render(
      <ToastProvider>
        <RoleProvider>
          <RoleSwitcher />
          <SupplierDetailPage />
        </RoleProvider>
      </ToastProvider>,
    );
  }

  it("renders the supplier header with identity, risk tier and contact info", () => {
    renderDetail("SUP-004");

    const header = screen.getByRole("banner");
    expect(within(header).getByText("Ironbridge Stampings")).toBeInTheDocument();
    expect(within(header).getAllByText("High").length).toBeGreaterThan(0);
    expect(within(header).getByText(/Dale Kowalski/)).toBeInTheDocument();
    expect(within(header).getByText(/Toledo, OH/)).toBeInTheDocument();
    expect(within(header).getByText(/SUP-004 · IBS · Machining/)).toBeInTheDocument();
  });

  it("shows the weighted scorecard and operational metrics", () => {
    renderDetail("SUP-004");

    // 74*.35 + 68*.25 + 66*.15 + 77*.1 + 72*.15 = 71.3
    expect(screen.getByText("71.3")).toBeInTheDocument();
    expect(screen.getByText("82.6%")).toBeInTheDocument(); // goods-in pass rate
    // PPM appears twice: detail metrics block and the scorecard footer.
    expect(screen.getAllByText("1,240")).toHaveLength(2);
  });

  it("lists this supplier's inspection history only (data isolation)", () => {
    renderDetail("SUP-003");

    const section = screen.getByRole("region", { name: /Inspection history/i });
    const table = within(section).getByRole("table");
    expect(within(table).getAllByText(/LOT-2026-/).length).toBe(2); // SUP-003 has 2 lots
    expect(
      within(table).queryByText(/Bracket Stamping LH/),
    ).not.toBeInTheDocument(); // Ironbridge lot must not leak in
  });

  it("links open NCRs back to the NCR detail page", () => {
    renderDetail("SUP-004");

    const link = screen.getByRole("link", { name: /NCR-2608/i });
    expect(link).toHaveAttribute("href", "/ncrs/NCR-2608");
  });

  it("shows a clean-record message when the supplier has no open NCRs", () => {
    renderDetail("SUP-001");
    expect(screen.getByText(/No open NCRs — clean record\./i)).toBeInTheDocument();
  });

  it("renders audit history with findings summary and closure status", () => {
    renderDetail("SUP-008");

    const auditSection = screen.getByText("Audit History").parentElement!;
    const auditList = within(auditSection).getAllByRole("list").at(-1)!;
    const item = within(auditList).getByText(/AUD-2619/, { exact: false }).closest("li")!;
    expect(item.textContent).toContain("SPC not applied to grinding cells");
    expect(item.textContent).toContain("Findings Closed");
  });

  it("offers Schedule Audit to the Quality Manager only", async () => {
    const user = userEvent.setup();
    // The demo Supplier User account owns SUP-003, so use its own record to
    // verify limited actions once the role switches.
    renderDetail("SUP-003");

    // QM sees the Schedule Audit action.
    expect(
      screen.getByRole("button", { name: /Schedule Audit/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));
    expect(
      screen.queryByRole("button", { name: /Schedule Audit/i }),
    ).not.toBeInTheDocument();
    // Raise NCR remains available as a limited supplier action.
    expect(screen.getByRole("button", { name: /Raise NCR/i })).toBeInTheDocument();
  });

  it("routes Raise NCR to the wizard preselected for this supplier", async () => {
    const user = userEvent.setup();
    renderDetail("SUP-004");

    await user.click(screen.getByRole("button", { name: /Raise NCR/i }));
    expect(mockPush).toHaveBeenCalledWith("/ncrs?new=1&supplier=SUP-004");
  });

  it("blocks cross-tenant access once switched to the Supplier User role (authorization)", async () => {
    const user = userEvent.setup();
    renderDetail("SUP-008"); // Redstone is not the demo supplier account

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));

    expect(await screen.findByText("Supplier not found")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Back to supplier list/i }),
    ).toHaveAttribute("href", "/suppliers");
  });

  it("shows a not-found fallback for an unknown id", () => {
    renderDetail("SUP-999");
    expect(screen.getByText("Supplier not found")).toBeInTheDocument();
  });
});

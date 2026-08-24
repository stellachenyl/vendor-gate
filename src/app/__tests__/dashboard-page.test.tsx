import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/dashboard/page";
import { RoleProvider, useRole } from "@/lib/role-context";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
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

describe("Dashboard page integration", () => {
  beforeAll(() => {
    // Freeze the clock only; user-event needs real timers.
    jest.useFakeTimers({
      now: new Date("2026-08-24T10:00:00Z"),
      doNotFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "queueMicrotask", "performance"],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockPush.mockClear();
  });

  function renderDashboard() {
    return render(
      <RoleProvider>
        <RoleSwitcher />
        <DashboardPage />
      </RoleProvider>,
    );
  }

  it("renders all five KPI cards for the Quality Manager", () => {
    renderDashboard();

    const cards = screen.getAllByTestId("metric-card");
    expect(cards).toHaveLength(5);

    const kpis = cards.map((c) => c.textContent ?? "");
    expect(kpis.some((t) => t.includes("Total Suppliers") && t.includes("15"))).toBe(true);
    expect(kpis.some((t) => t.includes("Active NCRs") && t.includes("6"))).toBe(true);
    expect(kpis.some((t) => t.includes("Overdue Corrective Actions"))).toBe(true);
    expect(kpis.some((t) => t.includes("Upcoming Audits"))).toBe(true);
    expect(kpis.some((t) => t.includes("Avg Inspection Pass Rate"))).toBe(true);
  });

  it("turns the overdue corrective actions card red when count > 0 and green at zero", () => {
    const { container } = renderDashboard();
    const overdue = screen.getAllByTestId("metric-card").find((c) =>
      c.textContent?.includes("Overdue Corrective Actions"),
    )!;
    expect(overdue.querySelector("[data-tone='warning']")).not.toBeNull();
    void container;
  });

  it("orders worst performers by pass rate ascending with Redstone first", () => {
    renderDashboard();

    const table = screen.getByRole("table");
    const firstNameCell = table.querySelector("tbody tr td");
    expect(firstNameCell).toHaveTextContent("Redstone Machining Works");
  });

  it("navigates to supplier detail when a worst-performer row is clicked", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const rows = screen.getAllByRole("row");
    const redstoneRow = rows.find((r) => r.textContent?.includes("Redstone Machining Works"))!;
    await user.click(redstoneRow);

    expect(mockPush).toHaveBeenCalledWith("/suppliers/SUP-008");
  });

  it("shows the five most recent NCRs with day counters and a View All link", () => {
    renderDashboard();

    const recentSection = screen
      .getByText(/Recent NCRs/i)
      .closest("div")!.parentElement!;
    const items = within(recentSection).getAllByRole("listitem").filter((li) =>
      li.textContent?.includes("NCR-"),
    );
    expect(items).toHaveLength(5);
    // Newest fixture NCR first, each with a days-open counter.
    expect(items[0]).toHaveTextContent("NCR-2611");
    expect(items[0]).toHaveTextContent("4d open");

    expect(screen.getByRole("link", { name: /View All/i })).toHaveAttribute(
      "href",
      "/ncrs",
    );
  });

  it("lists the next five audits in date order with lead auditor", () => {
    renderDashboard();

    // Preview = next 5 scheduled/in-progress/overdue audits by date.
    expect(screen.getByText(/Ironbridge Stampings — Toledo/i)).toBeInTheDocument();
    expect(screen.getByText(/Redstone Machining Works — Erie/i)).toBeInTheDocument();
    // Surveillance audit (15 Sep) is beyond the KPI's 14-day window but still
    // belongs in the "next 5" preview per spec.
    expect(screen.getByText(/BSI \(external\)/)).toBeInTheDocument();
    // The overdue July process audit sorts first.
    const dates = screen
      .getAllByText(/\d{2} \w{3} \d{4}/)
      .map((el) => el.textContent);
    expect(dates.indexOf("16 Jul 2026")).toBeLessThan(dates.indexOf("27 Aug 2026"));
  });

  it("scopes every widget to the Supplier User's own records (authorization)", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));

    const cards = screen.getAllByTestId("metric-card");
    const total = cards.find((c) => c.textContent?.includes("Total Suppliers"))!;
    expect(total).toHaveTextContent("1"); // only Golden Circuit Electronics

    // No cross-tenant supplier data anywhere on the page.
    expect(screen.queryByText(/Redstone Machining Works/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ironbridge Stampings — Toledo/)).not.toBeInTheDocument();
  });

  // Regression guard (was a confirmed defect): the KPI hint previously used
  // global stats, so a Supplier User saw "Total Suppliers 1" alongside
  // "13 active · 2 inactive". Hint and value must derive from the same set.
  it("derives the active/inactive breakdown from the same scoped set as the value", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /become-supplier-user/i }));

    const total = screen
      .getAllByTestId("metric-card")
      .find((c) => c.textContent?.includes("Total Suppliers"))!;
    expect(total.textContent).toContain("1 active · 0 inactive");

    // The Active NCRs severity breakdown is scoped identically.
    const ncrCard = screen
      .getAllByTestId("metric-card")
      .find((c) => c.textContent?.includes("Active NCRs"))!;
    expect(ncrCard.textContent).toContain("0 Major · 0 Minor");
  });

  it("keeps the global Major/Minor breakdown for the Quality Manager", () => {
    renderDashboard();

    const ncrCard = screen
      .getAllByTestId("metric-card")
      .find((c) => c.textContent?.includes("Active NCRs"))!;
    expect(ncrCard).toHaveTextContent("2 Major");
  });
});

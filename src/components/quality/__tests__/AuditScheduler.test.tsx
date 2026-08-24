import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuditScheduler } from "@/components/quality/AuditScheduler";
import { audits } from "@/lib/mock-data";

describe("AuditScheduler", () => {
  beforeAll(() => {
    // Freeze only the clock (Date) — real timers are needed by user-event.
    jest.useFakeTimers({
      now: new Date("2026-08-24T10:00:00Z"),
      doNotFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "queueMicrotask",
        "performance",
      ],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  function renderScheduler() {
    return render(<AuditScheduler audits={audits} />);
  }

  it("opens on the current month with today's date selected by default", () => {
    renderScheduler();

    expect(screen.getByText("August 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /24 Aug 2026/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No audits scheduled on this date/i),
    ).toBeInTheDocument();
  });

  it("aligns the first of the month under the correct weekday (Aug 1, 2026 = Saturday)", () => {
    const { container } = renderScheduler();

    const grid = screen.getByRole("grid", { name: "August 2026" });
    const cells = Array.from(grid.children);

    // 7 weekday headers + 5 leading blanks (Mon–Fri of the prior week).
    const firstDayCell = cells[7 + 5] as HTMLElement;
    expect(firstDayCell.tagName).toBe("BUTTON");
    expect(firstDayCell).toHaveAccessibleName(/01 Aug 2026/);
    void container;
  });

  it("shows audit details for a selected day including auditor and location", async () => {
    const user = userEvent.setup();
    renderScheduler();

    await user.click(screen.getByRole("button", { name: /27 Aug 2026, 1 audit/ }));

    const aside = screen.getByText(/27 Aug 2026/i).closest("aside");
    expect(aside).not.toBeNull();
    expect(within(aside!).getByText("AUD-2631")).toBeInTheDocument();
    expect(within(aside!).getByText("Process Audit")).toBeInTheDocument();
    expect(
      within(aside!).getByText(/Ironbridge Stampings — Toledo, OH/),
    ).toBeInTheDocument();
    expect(within(aside!).getByText(/Auditor: R\. Okafor/)).toBeInTheDocument();
  });

  it("navigates between months without losing the calendar structure", async () => {
    const user = userEvent.setup();
    renderScheduler();

    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("grid", { name: "July 2026" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next month" }));
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "September 2026" })).toBeInTheDocument();
  });

  it("rolls over year boundaries correctly when navigating months", async () => {
    const user = userEvent.setup();
    renderScheduler();

    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole("button", { name: "Next month" }));
    }
    expect(screen.getByRole("grid", { name: "January 2027" })).toBeInTheDocument();
  });

  it("summarizes multiple audits on a single day in the grid cell", () => {
    const busyDay = [
      audits[0]!,
      {
        ...audits[1]!,
        id: "AUD-EXTRA",
        date: audits[0]!.date,
        location: "Overflow Site",
      },
      {
        ...audits[2]!,
        id: "AUD-EXTRA-2",
        date: audits[0]!.date,
        location: "Overflow Site 2",
      },
    ];
    render(<AuditScheduler audits={busyDay} />);

    // Two chips rendered inline; the remainder collapsed into a "+N more".
    const dayButton = screen.getByRole("button", {
      name: /27 Aug 2026, 3 audit/,
    });
    expect(dayButton).toHaveTextContent("+1 more");
  });
});

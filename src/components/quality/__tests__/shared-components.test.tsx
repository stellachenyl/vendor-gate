import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EightDStepper } from "@/components/quality/EightDStepper";
import { ActivityTimeline } from "@/components/quality/ActivityTimeline";
import { MetricCard } from "@/components/ui/MetricCard";
import { RiskDonut } from "@/components/charts/RiskDonut";
import { UploadZone } from "@/components/quality/UploadZone";
import { ToastProvider } from "@/components/ui/Toast";
import { eightDSteps } from "@/components/quality/testing";

describe("EightDStepper states", () => {
  function dots(container: HTMLElement) {
    return Array.from(container.querySelectorAll("[data-state]"));
  }

  it("marks completed steps with a checkmark and the first open step as current", () => {
    const { container } = render(<EightDStepper progress={eightDSteps(3)} />);

    expect(
      screen.getByRole("group", { name: /8D progress: 3 of 8 steps complete/ }),
    ).toBeInTheDocument();
    expect(dots(container)).toHaveLength(8);
    expect(container.querySelectorAll("[data-state='completed']")).toHaveLength(3);
    expect(container.querySelectorAll("[data-state='current']")).toHaveLength(1);
    expect(container.querySelectorAll("[data-state='pending']")).toHaveLength(4);
  });

  it("announces the current step via aria-current for screen readers", () => {
    const { container } = render(<EightDStepper progress={eightDSteps(0)} />);
    const all = dots(container);
    // Nothing done: D1 is the current step.
    expect(all[0]).toHaveAttribute("aria-current", "step");
    expect(all[1]).not.toHaveAttribute("aria-current");
    expect(all[0]).toHaveTextContent("1"); // pending/current show numbers
  });

  it("shows checkmarks on every step when all eight are done (no current step)", () => {
    const { container } = render(<EightDStepper progress={eightDSteps(8)} />);
    const all = dots(container);
    for (const dot of all) expect(dot).toHaveTextContent("\u2713");
    expect(container.querySelectorAll("[data-state='current']")).toHaveLength(0);
  });
});

describe("ActivityTimeline", () => {
  const entries = [
    { date: "2026-08-12", actor: "R. Okafor", event: "NCR raised." },
    { date: "2026-08-14", actor: "L. Brennan", event: "Containment confirmed." },
    { date: "2026-08-13", actor: "System", event: "Supplier notified." },
  ];

  it("renders newest events first regardless of input order", () => {
    render(<ActivityTimeline entries={entries} />);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringContaining("14 Aug 2026"),
      expect.stringContaining("13 Aug 2026"),
      expect.stringContaining("12 Aug 2026"),
    ]);
  });

  it("shows an empty-state message when no activity exists", () => {
    render(<ActivityTimeline entries={[]} />);
    expect(screen.getByText(/No activity recorded yet/i)).toBeInTheDocument();
  });
});

describe("MetricCard", () => {
  it("applies warning tone styling for alert KPIs", () => {
    render(<MetricCard label="Overdue CAs" value="2" hint="past due" tone="warning" />);
    expect(screen.getByText("2").className).toContain("text-status-rejected");
    expect(screen.getByText("past due")).toBeInTheDocument();
  });

  it("omits the hint element entirely when not provided", () => {
    const { container } = render(<MetricCard label="Suppliers" value="15" />);
    expect(container.querySelectorAll("p")).toHaveLength(2); // label + value only
  });
});

describe("RiskDonut", () => {
  it("falls back to an empty-state message when no suppliers are visible", () => {
    render(<RiskDonut suppliers={[]} />);
    expect(screen.getByText(/No suppliers to display/i)).toBeInTheDocument();
  });

  it("renders zero-count tiers in the legend with their counts", () => {
    render(<RiskDonut suppliers={[{ riskTier: "Low" }, { riskTier: "Critical" }]} />);

    const legend = screen.getByRole("img").nextElementSibling as HTMLElement;
    expect(within(legend).getByText("Low").nextElementSibling).toHaveTextContent("1");
    expect(within(legend).getByText("Medium").nextElementSibling).toHaveTextContent("0");
    expect(within(legend).getByText("Critical").nextElementSibling).toHaveTextContent("1");
  });
});

describe("UploadZone (mock)", () => {
  function renderZone() {
    return render(
      <ToastProvider>
        <UploadZone />
      </ToastProvider>,
    );
  }

  function dropEvent(files: File[]): Event {
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: { files } });
    return drop;
  }

  it("queues dropped files and reports them by name", async () => {
    renderZone();
    const zone = screen.getByRole("button", { name: /Upload document/i });
    act(() => {
      zone.dispatchEvent(
        dropEvent([
          new File(["x"], "a.pdf", { type: "application/pdf" }),
          new File(["y"], "b.xlsx", { type: "application/vnd.ms-excel" }),
        ]),
      );
    });

    expect(await screen.findByRole("status")).toHaveTextContent(/a\.pdf, b\.xlsx/);
  });

  it("reports an error toast when a drop contains no files", async () => {
    renderZone();
    const zone = screen.getByRole("button", { name: /Upload document/i });
    act(() => {
      zone.dispatchEvent(dropEvent([]));
    });

    expect(await screen.findByRole("status")).toHaveTextContent(/No files detected/i);
  });

  it("opens the file browser on keyboard activation (Enter)", async () => {
    const user = userEvent.setup();
    renderZone();
    const clickSpy = jest
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => {});
    await user.tab();
    await user.keyboard("{Enter}");
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});

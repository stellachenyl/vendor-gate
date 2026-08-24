import { render, screen } from "@testing-library/react";
import { NonConformanceReportCard } from "@/components/quality/NonConformanceReport";
import { getSupplier, ncrs } from "@/lib/mock-data";

// Fixed reference date so day counters are deterministic.
const TODAY = new Date("2026-08-24T12:00:00Z");

const openNcr = ncrs.find((n) => n.id === "NCR-2608")!; // raised 2026-08-12, no root cause
const closedNcr = ncrs.find((n) => n.id === "NCR-2594")!; // 8/8 done, closed
const staleNcr = ncrs.find((n) => n.id === "NCR-2601")!; // raised 2026-07-21 → 34 days

describe("NonConformanceReportCard", () => {
  it("renders identity, part linkage and priority/status badges", () => {
    render(<NonConformanceReportCard ncr={openNcr} today={TODAY} />);

    expect(screen.getByText("NCR-2608")).toBeInTheDocument();
    expect(screen.getByText(openNcr.title)).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument(); // priority
    expect(screen.getByText("Investigating")).toBeInTheDocument(); // status
    expect(screen.getByText(/P\/N TNX-3320-D/)).toBeInTheDocument();
    expect(screen.getByText(getSupplier(openNcr.supplierId)!.name)).toBeInTheDocument();
  });

  it("shows cost impact, affected quantity and assigned engineer", () => {
    render(<NonConformanceReportCard ncr={openNcr} today={TODAY} />);

    expect(screen.getByText("Qty affected: 2,000")).toBeInTheDocument();
    expect(screen.getByText("Cost impact: $18,500")).toBeInTheDocument();
    expect(screen.getByText("L. Brennan")).toBeInTheDocument();
  });

  it("computes days open from the raise date against the reference date", () => {
    render(<NonConformanceReportCard ncr={openNcr} today={TODAY} />);
    // 2026-08-12 → 2026-08-24 = 12 days.
    expect(screen.getByText("12d open")).toBeInTheDocument();
  });

  it("flags NCRs open longer than 30 days in red", () => {
    render(<NonConformanceReportCard ncr={staleNcr} today={TODAY} />);
    const chip = screen.getByText("34d open");
    expect(chip.className).toContain("text-red-700");
  });

  it("hides the day counter on same-day reports (0d open is noise)", () => {
    render(
      <NonConformanceReportCard ncr={{ ...openNcr, raisedDate: "2026-08-24" }} today={TODAY} />,
    );
    expect(screen.queryByText(/d open/)).not.toBeInTheDocument();
  });

  it("marks exactly the completed D-steps and exposes progress to assistive tech", () => {
    render(<NonConformanceReportCard ncr={openNcr} today={TODAY} />);

    const group = screen.getByRole("group", {
      name: /8D progress: 2 of 8 steps complete/,
    });
    expect(group).toBeInTheDocument();

    const circles = document.querySelectorAll("ol > li span:first-child");
    expect(circles).toHaveLength(8);
    // Completed steps show a checkmark; pending steps show their number.
    expect(circles[0]).toHaveTextContent("\u2713");
    expect(circles[2]).toHaveTextContent("3");
    expect(circles[7]).toHaveTextContent("8");
  });

  it("displays the identified root cause category once D4 is complete", () => {
    render(<NonConformanceReportCard ncr={closedNcr} today={TODAY} />);

    expect(screen.getByText("Tooling Wear")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: /8D progress: 8 of 8 steps complete/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("reports 'Under investigation' while the root cause category is open", () => {
    render(<NonConformanceReportCard ncr={openNcr} today={TODAY} />);
    expect(screen.getByText("Under investigation")).toBeInTheDocument();
  });

  it("credits the raiser and sizes the 8D team for traceability", () => {
    render(<NonConformanceReportCard ncr={openNcr} today={TODAY} />);
    expect(screen.getByText(/Raised by R\. Okafor/)).toBeInTheDocument();
    expect(screen.getByText(/Team: 4 member\(s\)/)).toBeInTheDocument();
  });
});

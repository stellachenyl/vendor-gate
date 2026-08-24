import { render, screen } from "@testing-library/react";
import { InspectionRecord } from "@/components/quality/InspectionRecord";
import { inspections } from "@/lib/mock-data";

const accepted = inspections.find((i) => i.id === "INS-2410")!; // 49/50 pass, accepted
const rejected = inspections.find((i) => i.id === "INS-2408")!; // 43/50 pass, rejected

describe("InspectionRecord", () => {
  it("renders lot identity, part linkage and supplier", () => {
    render(<InspectionRecord record={rejected} />);

    expect(screen.getByText("LOT-2026-08110")).toBeInTheDocument();
    expect(screen.getByText(/Bracket Stamping LH/)).toBeInTheDocument();
    expect(screen.getByText(/P\/N TNX-3320-D/)).toBeInTheDocument();
    expect(screen.getByText(/PO-88152/)).toBeInTheDocument();
    expect(screen.getByText(/Ironbridge Stampings/)).toBeInTheDocument();
  });

  it("computes and displays the sample pass rate to one decimal", () => {
    render(<InspectionRecord record={accepted} />);
    // 49/50 = 98.0%
    expect(screen.getByText("98.0")).toBeInTheDocument();

    const { unmount } = render(<InspectionRecord record={rejected} />);
    // 43/50 = 86.0%
    expect(screen.getByText("86.0")).toBeInTheDocument();
    unmount();
  });

  it("shows the sampling plan fields (sample size, lot quantity, AQL)", () => {
    render(<InspectionRecord record={rejected} />);

    expect(screen.getByText("50")).toBeInTheDocument(); // sample size
    expect(screen.getByText("2,000")).toBeInTheDocument(); // lot qty
    expect(screen.getByText("1.5")).toBeInTheDocument(); // AQL
  });

  it("flags failed lots visually with a rejection accent", () => {
    const { container, unmount } = render(<InspectionRecord record={rejected} />);

    expect(container.firstElementChild?.className).toContain(
      "border-status-rejected",
    );
    unmount();
  });

  it("keeps accepted lots on the neutral border", () => {
    const { container } = render(<InspectionRecord record={accepted} />);

    expect(container.firstElementChild?.className).not.toContain(
      "border-status-rejected",
    );
  });

  it("preserves inspector notes verbatim for traceability", () => {
    render(<InspectionRecord record={rejected} />);
    expect(
      screen.getByText(/Edge cracking on flange radius/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Inspected by R\. Okafor/)).toBeInTheDocument();
  });

  it("guards against division by zero when a record has no sampled units", () => {
    const degenerate = { ...accepted, sampleSize: 0, passCount: 0 };
    render(<InspectionRecord record={degenerate} />);

    // NaN must never leak into the rendered pass rate.
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});

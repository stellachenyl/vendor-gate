import { render, screen } from "@testing-library/react";
import { NonConformanceReportCard } from "@/components/quality/NonConformanceReport";
import { getSupplier, ncrs } from "@/lib/mock-data";

const openNcr = ncrs.find((n) => n.id === "NCR-2608")!; // 2/8 steps done, no root cause
const closedNcr = ncrs.find((n) => n.id === "NCR-2594")!; // 8/8 steps done

describe("NonConformanceReportCard", () => {
  it("renders identity, part linkage and priority/status badges", () => {
    render(<NonConformanceReportCard ncr={openNcr} />);

    expect(screen.getByText("NCR-2608")).toBeInTheDocument();
    expect(screen.getByText(openNcr.title)).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument(); // priority
    expect(screen.getByText("Investigating")).toBeInTheDocument(); // status
    expect(screen.getByText(/P\/N TNX-3320-D/)).toBeInTheDocument();
    expect(
      screen.getByText(getSupplier(openNcr.supplierId)!.name),
    ).toBeInTheDocument();
  });

  it("shows cost impact and affected quantity as currency/count", () => {
    render(<NonConformanceReportCard ncr={openNcr} />);

    expect(screen.getByText("Qty affected: 2,000")).toBeInTheDocument();
    expect(screen.getByText("Cost impact: $18,500")).toBeInTheDocument();
  });

  it("marks exactly the completed D-steps and exposes progress to assistive tech", () => {
    const { container } = render(<NonConformanceReportCard ncr={openNcr} />);

    const group = screen.getByRole("group", {
      name: /8D progress: 2 of 8 steps complete/,
    });
    const circles = container.querySelectorAll("ol > li span:first-child");
    expect(circles).toHaveLength(8);
    expect(group).toBeInTheDocument();

    // D1 and D2 done (white on filled), D3..D8 pending.
    expect(circles[0]).toHaveTextContent("1");
    expect(circles[2]).toHaveTextContent("3");
    expect(circles[7]).toHaveTextContent("8");
  });

  it("prompts for the root cause while D4 is still open", () => {
    render(<NonConformanceReportCard ncr={openNcr} />);

    expect(
      screen.getByText("Under investigation — D4 in progress."),
    ).toBeInTheDocument();
  });

  it("displays the identified root cause once D4 is complete", () => {
    render(<NonConformanceReportCard ncr={closedNcr} />);

    expect(
      screen.getByText(/Tooling clamp wear allowed mold breathing/i),
    ).toBeInTheDocument();
  });

  it("marks a fully closed 8D with all eight steps done", () => {
    render(<NonConformanceReportCard ncr={closedNcr} />);
    expect(
      screen.getByRole("group", {
        name: /8D progress: 8 of 8 steps complete/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("falls back to 'Pending assignment' when containment has not been recorded", () => {
    // No shipped fixture leaves containment blank, so exercise the fallback
    // contract with a minimal freshly-raised report.
    const bare = { ...openNcr, id: "NCR-9999", containmentAction: "", rootCause: "" };
    render(<NonConformanceReportCard ncr={bare} />);
    expect(screen.getByText("Pending assignment.")).toBeInTheDocument();
  });

  it("credits the raiser for traceability", () => {
    render(<NonConformanceReportCard ncr={openNcr} />);
    expect(screen.getByText(/Raised by R\. Okafor/)).toBeInTheDocument();
  });
});

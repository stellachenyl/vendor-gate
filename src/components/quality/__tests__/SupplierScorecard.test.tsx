import { render, screen } from "@testing-library/react";
import { SupplierScorecard } from "@/components/quality/SupplierScorecard";
import { suppliers } from "@/lib/mock-data";
import type { Supplier } from "@/lib/types";

const fixture: Supplier = {
  id: "SUP-TST",
  name: "Test Gage Co.",
  code: "TGC",
  category: "Machining",
  riskTier: "Medium",
  passRate: 90,
  openNcrs: 0,
  lastAuditDate: null,
  status: "Active",
  trend: "stable",
  contactName: "Q. Tester",
  contactEmail: "q@testgage.example",
  phone: "+1 000-555-0100",
  location: "Testville, OH",
  overallScore: 79.5,
  kpis: { quality: 100, delivery: 80, responsiveness: 60, documentation: 40, pricing: 50 },
  weights: { quality: 0.4, delivery: 0.3, responsiveness: 0.15, documentation: 0.1, pricing: 0.05 },
  approvedSince: "2024-01-01",
  onTimeDeliveryPct: 91.5,
  ppmDefects: 250,
};

describe("SupplierScorecard", () => {
  it("computes the headline weighted score across all five KPI axes", () => {
    render(<SupplierScorecard supplier={fixture} />);

    // 100*.4 + 80*.3 + 60*.15 + 40*.1 + 50*.05 = 79.5
    expect(screen.getByText("79.5")).toBeInTheDocument();
  });

  it("exposes every KPI value through the radar chart's accessible name", () => {
    render(<SupplierScorecard supplier={fixture} />);

    const chart = screen.getByRole("img");
    expect(chart).toHaveAccessibleName(
      /Quality 100.*Delivery 80.*Responsiveness 60.*Documentation 40.*Pricing 50/,
    );
  });

  it("renders all five axis labels with raw KPI percentages", () => {
    render(<SupplierScorecard supplier={fixture} />);

    expect(screen.getByText(/Quality \(100\)/)).toBeInTheDocument();
    expect(screen.getByText(/Delivery \(80\)/)).toBeInTheDocument();
    expect(screen.getByText(/Resp\. \(60\)/)).toBeInTheDocument();
    expect(screen.getByText(/Docs \(40\)/)).toBeInTheDocument();
    expect(screen.getByText(/Pricing \(50\)/)).toBeInTheDocument();
  });

  it.each([
    ["SUP-001"], // 96*.35+94*.25+92*.15+95*.1+93*.15
    ["SUP-008"],
    ["SUP-011"], // clean-decimal fixture
  ])("displays a weighted score for %s consistent with its KPIs", (supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId)!;
    const k = supplier.kpis;
    const w = supplier.weights;
    // Same arithmetic order as the component so float rounding matches.
    const expected = (
      k.quality * w.quality +
      k.delivery * w.delivery +
      k.responsiveness * w.responsiveness +
      k.documentation * w.documentation +
      k.pricing * w.pricing
    ).toFixed(1);

    render(<SupplierScorecard supplier={supplier} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

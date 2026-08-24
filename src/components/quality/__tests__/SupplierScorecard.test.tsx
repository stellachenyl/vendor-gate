import { render, screen } from "@testing-library/react";
import { SupplierScorecard } from "@/components/quality/SupplierScorecard";
import { suppliers } from "@/lib/mock-data";
import type { Supplier } from "@/lib/types";

const fixture: Supplier = {
  id: "SUP-TST",
  name: "Test Gage Co.",
  code: "TGC",
  riskTier: "Medium",
  partCategory: "Gauges",
  contactEmail: "q@testgage.example",
  location: "Testville, OH",
  overallScore: 90,
  kpis: { quality: 100, delivery: 80, responsiveness: 60, documentation: 40 },
  weights: { quality: 0.5, delivery: 0.5, responsiveness: 0, documentation: 0 },
  approvedSince: "2024-01-01",
  onTimeDeliveryPct: 91.5,
  ppmDefects: 250,
};

describe("SupplierScorecard", () => {
  it("computes the headline weighted score from KPIs and weights", () => {
    render(<SupplierScorecard supplier={fixture} />);

    // (100*0.5 + 80*0.5 + 60*0 + 40*0) = 90.0 — not the raw overallScore field.
    expect(screen.getByText("90.0")).toBeInTheDocument();
  });

  it("exposes every KPI value through the radar chart's accessible name", () => {
    render(<SupplierScorecard supplier={fixture} />);

    const chart = screen.getByRole("img");
    expect(chart).toHaveAccessibleName(
      /Quality 100.*Delivery 80.*Responsiveness 60.*Documentation 40/,
    );
  });

  it("renders axis labels with raw KPI percentages", () => {
    render(<SupplierScorecard supplier={fixture} />);

    expect(screen.getByText(/Quality \(100\)/)).toBeInTheDocument();
    expect(screen.getByText(/Docs \(40\)/)).toBeInTheDocument();
  });

  it("shows delivery and PPM operational metrics", () => {
    render(<SupplierScorecard supplier={fixture} />);

    expect(screen.getByText("91.5%")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
  });

  it.each([
    ["SUP-001", 94.4], // 96*.4+93*.3+92*.15+95*.15 = 94.35 → displays 94.4
    ["SUP-011", 92.8], // 95*.4+91*.3+90*.15+93*.15 = 92.75
  ])("computes the weighted score for %s", (supplierId, expected) => {
    const supplier = suppliers.find((s) => s.id === supplierId)!;
    render(<SupplierScorecard supplier={supplier} />);

    expect(screen.getByText(expected.toFixed(1))).toBeInTheDocument();
  });
});

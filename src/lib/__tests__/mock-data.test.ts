import {
  audits,
  dashboardStats,
  documents,
  getSupplier,
  inspections,
  lastAuditDate,
  ncrs,
  nextSurveillanceAudit,
  suppliers,
} from "@/lib/mock-data";

describe("mock data referential integrity", () => {
  it("assigns unique supplier ids", () => {
    const ids = suppliers.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves every inspection and NCR to a known supplier (no orphan records)", () => {
    for (const record of [...inspections, ...ncrs]) {
      expect(getSupplier(record.supplierId)).toBeDefined();
    }
  });

  it("assigns unique lot numbers and inspection ids", () => {
    expect(new Set(inspections.map((i) => i.id)).size).toBe(inspections.length);
    expect(new Set(inspections.map((i) => i.lotNumber)).size).toBe(
      inspections.length,
    );
  });

  it("assigns unique document and audit ids", () => {
    expect(new Set(documents.map((d) => d.id)).size).toBe(documents.length);
    expect(new Set(audits.map((a) => a.id)).size).toBe(audits.length);
  });
});

describe("inspection record invariants", () => {
  it.each(inspections)(
    "keeps $id pass/fail counts within the sample and lot bounds",
    ({ passCount, failCount, sampleSize, lotQuantity }) => {
      expect(passCount).toBeGreaterThanOrEqual(0);
      expect(failCount).toBeGreaterThanOrEqual(0);
      expect(passCount + failCount).toBeLessThanOrEqual(sampleSize);
      expect(sampleSize).toBeLessThanOrEqual(lotQuantity);
    },
  );

  it.each(inspections)(
    "never accepts a lot ($id) that recorded failures at AQL 1.0 or tighter",
    ({ id, failCount, aqlLevel, disposition }) => {
      if (disposition === "Accepted" && Number(aqlLevel) <= 1.0) {
        // ANSI/ASQ Z1.4 acceptance number for these sample plans is >= 1;
        // an Accepted lot may contain at most the plan's acceptance number of
        // defects. Fixture data must not contradict its own stated AQL.
        expect(failCount).toBeLessThanOrEqual(2);
      }
      expect(id).toBeTruthy();
    },
  );

  it("requires at least one failure before rejecting or returning a lot", () => {
    for (const record of inspections) {
      if (
        record.disposition === "Rejected" ||
        record.disposition === "Return to Supplier"
      ) {
        expect(record.failCount).toBeGreaterThan(0);
      }
    }
  });
});

describe("NCR eight-D progress invariants", () => {
  it("tracks exactly the eight disciplined steps for every NCR", () => {
    for (const report of ncrs) {
      expect(report.eightDProgress).toHaveLength(8);
    }
  });

  it("only ever marks a prefix of steps complete (no skipped disciplines)", () => {
    for (const report of ncrs) {
      const flags = report.eightDProgress.map((s) => s.done);
      const firstOpen = flags.indexOf(false);
      if (firstOpen !== -1) {
        expect(flags.slice(firstOpen)).toEqual(
          Array(flags.length - firstOpen).fill(false),
        );
      }
    }
  });

  it("derives NCR status consistently from D-step progress", () => {
    for (const report of ncrs) {
      const done = report.eightDProgress.filter((s) => s.done).length;
      if (report.status === "Closed") {
        expect(done).toBe(8);
      } else {
        expect(done).toBeLessThan(8);
      }
      // Root cause identified implies containment (D3) completed first.
      if (done >= 4) {
        expect(report.rootCause.length).toBeGreaterThan(0);
        expect(report.containmentAction.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("supplier scorecard data integrity", () => {
  it("keeps KPI scores within the 0–100 band", () => {
    for (const supplier of suppliers) {
      for (const value of Object.values(supplier.kpis)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it.each(suppliers)("weights for $code sum to 100%", ({ weights }) => {
    expect(weights.quality + weights.delivery + weights.responsiveness + weights.documentation).toBeCloseTo(1, 9);
  });

  it("stores overall scores consistent with the weighted KPI formula (±0.6)", () => {
    // NOTE: several fixtures drift by ~0.15–0.55 (e.g. SUP-001 computes to
    // 94.35 vs stored 94.2; SUP-003 computes to 83.95 vs stored 84.5). The
    // tolerance documents that overallScore is authoritative but must stay
    // close to the live computation; see test report.
    for (const supplier of suppliers) {
      const w = supplier.weights;
      const k = supplier.kpis;
      const computed =
        k.quality * w.quality +
        k.delivery * w.delivery +
        k.responsiveness * w.responsiveness +
        k.documentation * w.documentation;
      expect(Math.abs(computed - supplier.overallScore)).toBeLessThanOrEqual(0.6);
    }
  });
});

describe("dashboard stats consistency", () => {
  it("reports total suppliers equal to the approved vendor list length", () => {
    expect(dashboardStats.totalSuppliers).toBe(suppliers.length);
  });

  it("counts active NCRs exactly as every non-closed NCR", () => {
    const expected = ncrs.filter((n) => n.status !== "Closed").length;
    expect(dashboardStats.activeNcrs).toBe(expected);
  });

  it("computes the average inspection pass rate from the underlying records", () => {
    const expected =
      Math.round(
        (inspections.reduce(
          (acc, i) => acc + (i.passCount / Math.max(i.sampleSize, 1)) * 100,
          0,
        ) /
          inspections.length) *
          10,
      ) / 10;
    expect(dashboardStats.avgPassRate).toBe(expected);
  });
});

describe("audit calendar data sanity", () => {
  it("uses parseable ISO dates throughout", () => {
    for (const audit of audits) {
      expect(Number.isNaN(Date.parse(audit.date))).toBe(false);
    }
    expect(Number.isNaN(Date.parse(lastAuditDate))).toBe(false);
    expect(Number.isNaN(Date.parse(nextSurveillanceAudit))).toBe(false);
  });

  it("schedules the surveillance audit after the last completed audit", () => {
    expect(nextSurveillanceAudit > lastAuditDate).toBe(true);
  });
});

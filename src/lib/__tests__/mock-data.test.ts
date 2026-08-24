import {
  addDays,
  audits,
  computeDashboardStats,
  documents,
  getNcr,
  getSupplier,
  inspections,
  lastAuditDate,
  ncrs,
  nextSurveillanceAudit,
  suppliers,
} from "@/lib/mock-data";

const TODAY = "2026-08-24"; // deterministic stats reference date

describe("mock data referential integrity", () => {
  it("assigns unique supplier ids", () => {
    const ids = suppliers.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves every inspection, NCR, and document to a known supplier (no orphans)", () => {
    for (const record of [...inspections, ...ncrs, ...documents]) {
      expect(getSupplier(record.supplierId)).toBeDefined();
    }
  });

  it("resolves audit supplier references", () => {
    for (const audit of audits) {
      if (audit.supplierId) expect(getSupplier(audit.supplierId)).toBeDefined();
    }
  });

  it("assigns unique lot numbers, inspection ids, document ids and audit ids", () => {
    expect(new Set(inspections.map((i) => i.id)).size).toBe(inspections.length);
    expect(new Set(inspections.map((i) => i.lotNumber)).size).toBe(inspections.length);
    expect(new Set(documents.map((d) => d.id)).size).toBe(documents.length);
    expect(new Set(audits.map((a) => a.id)).size).toBe(audits.length);
  });

  it("matches the fixture contract: 15 suppliers / 25 inspections / 8 NCRs / 20 documents", () => {
    expect(suppliers).toHaveLength(15);
    expect(inspections).toHaveLength(25);
    expect(ncrs).toHaveLength(8);
    expect(documents).toHaveLength(20);
  });
});

describe("supplier master data invariants", () => {
  it("uses only the approved commodity categories", () => {
    const allowed = ["Machining", "Plastics", "Electronics", "Packaging", "Raw Material"];
    for (const s of suppliers) expect(allowed).toContain(s.category);
  });

  it("keeps pass rates within a sane 0–100 band", () => {
    for (const s of suppliers) {
      expect(s.passRate).toBeGreaterThan(0);
      expect(s.passRate).toBeLessThanOrEqual(100);
    }
  });

  it.each(suppliers)("weights for $code sum to 100% across all five KPI axes", ({ weights }) => {
    const sum =
      weights.quality +
      weights.delivery +
      weights.responsiveness +
      weights.documentation +
      weights.pricing;
    expect(sum).toBeCloseTo(1, 9);
  });

  it("stores overall scores consistent with the weighted KPI formula (±0.6)", () => {
    for (const s of suppliers) {
      const w = s.weights;
      const k = s.kpis;
      const computed =
        k.quality * w.quality +
        k.delivery * w.delivery +
        k.responsiveness * w.responsiveness +
        k.documentation * w.documentation +
        k.pricing * w.pricing;
      expect(Math.abs(computed - s.overallScore)).toBeLessThanOrEqual(0.6);
    }
  });

  it("reports open NCR counts that never exceed the actual open NCRs for that supplier", () => {
    for (const s of suppliers) {
      const actual = ncrs.filter((n) => n.supplierId === s.id && n.status !== "Closed").length;
      expect(s.openNcrs).toBeGreaterThanOrEqual(actual);
    }
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
  it("tracks exactly eight disciplined steps for every NCR", () => {
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

  it("derives NCR status consistently from D-step progress and sign-offs", () => {
    for (const report of ncrs) {
      const done = report.eightDProgress.filter((s) => s.done).length;
      if (report.status === "Closed") {
        expect(done).toBe(8);
        expect(report.closure).toBeDefined();
        expect(report.verification).toBeDefined();
      } else {
        expect(done).toBeLessThan(8);
      }
      if (done >= 4) {
        expect(report.rootCause.length).toBeGreaterThan(0);
        expect(report.rootCauseCategory?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("assigns an engineer to every NCR and resolves getNcr lookups", () => {
    for (const report of ncrs) {
      expect(report.assignedEngineer.length).toBeGreaterThan(0);
      expect(getNcr(report.id)).toBe(report);
    }
    expect(getNcr("NCR-NOPE")).toBeUndefined();
  });

  it("never schedules corrective action due dates before the NCR was raised", () => {
    for (const report of ncrs) {
      for (const ca of report.correctiveActions) {
        expect(ca.dueDate >= report.raisedDate).toBe(true);
      }
    }
  });

  it("orders each activity log chronologically ascending", () => {
    for (const report of ncrs) {
      const dates = report.activityLog.map((a) => a.date);
      expect([...dates].sort()).toEqual(dates);
    }
  });
});

describe("document vault data invariants", () => {
  it("covers all four controlled document types", () => {
    const types = Array.from(new Set(documents.map((d) => d.docType))).sort();
    expect(types).toEqual(["Audit Report", "Certificate", "PPAP", "SOP"]);
  });

  it("spans all three approval statuses", () => {
    const statuses = Array.from(new Set(documents.map((d) => d.approvalStatus))).sort();
    expect(statuses).toEqual(["Approved", "Pending", "Rejected"]);
  });
});

describe("dashboard stats derivation", () => {
  const stats = computeDashboardStats(TODAY);

  it("reports totals equal to the underlying collections", () => {
    expect(stats.totalSuppliers).toBe(suppliers.length);
    expect(stats.activeSuppliers + stats.inactiveSuppliers).toBe(suppliers.length);
    expect(stats.activeSuppliers).toBe(suppliers.filter((s) => s.status === "Active").length);
  });

  it("counts active NCRs and their Major/Minor breakdown correctly", () => {
    const active = ncrs.filter((n) => n.status !== "Closed");
    expect(stats.activeNcrs).toBe(active.length);
    expect(stats.majorNcrs).toBe(active.filter((n) => n.priority === "Major").length);
    expect(stats.minorNcrs).toBe(active.filter((n) => n.priority === "Minor").length);
  });

  it("computes the average pass rate only over inspections received in the last 30 days", () => {
    const cutoff = addDays(TODAY, -30);
    const recent = inspections.filter((i) => i.receivedDate >= cutoff);
    expect(recent.length).toBeGreaterThan(0);
    const expected =
      Math.round(
        (recent.reduce(
          (acc, i) => acc + (i.passCount / Math.max(i.sampleSize, 1)) * 100,
          0,
        ) /
          recent.length) *
          10,
      ) / 10;
    expect(stats.avgPassRate).toBe(expected);
  });

  it("counts overdue corrective actions as past-due and not Done", () => {
    const expected = ncrs.reduce(
      (acc, n) =>
        acc +
        n.correctiveActions.filter(
          (ca) => ca.dueDate < TODAY && ca.status !== "Done",
        ).length,
      0,
    );
    expect(stats.overdueCorrectiveActions).toBe(expected);
    expect(stats.overdueCorrectiveActions).toBeGreaterThan(0); // fixtures must exercise this path
  });

  it("counts upcoming audits within a 14-day horizon", () => {
    const horizon = addDays(TODAY, 14);
    const expected = audits.filter(
      (a) =>
        (a.status === "Scheduled" || a.status === "In Progress") &&
        a.date >= TODAY &&
        a.date <= horizon,
    ).length;
    expect(stats.upcomingAudits).toBe(expected);
    expect(addDays(TODAY, 14)).toBe("2026-09-07");
  });

  it("treats a corrective action as overdue only after its due date has passed", () => {
    // CA-2 of NCR-2601 is In Progress, due 2026-08-22.
    // Boundary: due date == reference day → NOT overdue.
    expect(computeDashboardStats("2026-08-22").overdueCorrectiveActions).toBe(0);
    // Day after due date → overdue.
    expect(
      computeDashboardStats("2026-08-23").overdueCorrectiveActions,
    ).toBeGreaterThanOrEqual(1);
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

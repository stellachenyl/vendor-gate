"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/data/DataTable";
import { RiskTierBadge } from "@/components/quality/PriorityBadge";
import { SupplierScorecard } from "@/components/quality/SupplierScorecard";
import { Input, Select } from "@/components/ui/FormControls";
import { Tabs } from "@/components/ui/Tabs";
import { suppliers } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import type { Supplier } from "@/lib/types";

const RISKS = ["All", "Low", "Medium", "High", "Critical"] as const;

export default function SuppliersPage() {
  // useSearchParams requires a Suspense boundary during static prerender.
  return (
    <Suspense fallback={null}>
      <SuppliersPageContent />
    </Suspense>
  );
}

function SuppliersPageContent() {
  const { canView, role } = useRole();
  // The global navbar search routes here with ?q=; seed the filter from it.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [riskFilter, setRiskFilter] = useState<(typeof RISKS)[number]>("All");

  const visible = useMemo(() => suppliers.filter((s) => canView(s.id)), [canView]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.partCategory.toLowerCase().includes(q);
      const matchesRisk = riskFilter === "All" || s.riskTier === riskFilter;
      return matchesQuery && matchesRisk;
    });
  }, [visible, query, riskFilter]);

  const columns = [
    {
      key: "name",
      header: "Supplier",
      value: (row: Supplier) => row.name,
      render: (row: Supplier) => (
        <div>
          <p className="font-medium text-accent">{row.name}</p>
          <p className="font-mono text-xs text-slate-400">
            {row.id} · {row.location}
          </p>
        </div>
      ),
    },
    {
      key: "partCategory",
      header: "Part Category",
    },
    {
      key: "riskTier",
      header: "Risk Tier",
      value: (row: Supplier) => row.riskTier,
      render: (row: Supplier) => <RiskTierBadge tier={row.riskTier} />,
    },
    {
      key: "onTimeDeliveryPct",
      header: "On-Time %",
      align: "right" as const,
      render: (row: Supplier) => (
        <span className="font-mono">{row.onTimeDeliveryPct}%</span>
      ),
    },
    {
      key: "ppmDefects",
      header: "PPM",
      align: "right" as const,
      render: (row: Supplier) => (
        <span className="font-mono">{row.ppmDefects.toLocaleString()}</span>
      ),
    },
    {
      key: "overallScore",
      header: "Score",
      align: "right" as const,
      value: (row: Supplier) => row.overallScore,
      render: (row: Supplier) => (
        <span className="font-mono font-bold text-slate-800">
          {row.overallScore.toFixed(1)}
        </span>
      ),
    },
  ];

  const scorecardTabs = filtered
    .slice(0, 4)
    .map((s) => ({
      id: s.id,
      label: s.code,
      content: <SupplierScorecard supplier={s} />,
    }));

  return (
    <>
      <div className="mb-5">
        <h1 className="page-title">Approved Supplier List</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {role} view · Performance scores weighted per commodity group. Review cadence
          follows risk tier.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            type="search"
            aria-label="Search suppliers"
            placeholder="Name, code, or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            aria-label="Filter by risk tier"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as (typeof RISKS)[number])}
            options={RISKS.map((r) => ({
              value: r,
              label: r === "All" ? "All risk tiers" : r,
            }))}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        csvFilename="approved-supplier-list.csv"
        caption={`${filtered.length} of ${visible.length} suppliers`}
      />

      <section className="mt-6" aria-label="Supplier scorecards">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">
          Weighted KPI Scorecards
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Showing the first four suppliers matching the current filter. Radar axes show
          raw KPI percent; the headline figure applies commodity weighting.
        </p>
        {scorecardTabs.length > 0 ? (
          <Tabs items={scorecardTabs} />
        ) : (
          <p className="card px-4 py-8 text-center text-sm text-slate-400">
            No suppliers match the current filters.
          </p>
        )}
      </section>
    </>
  );
}

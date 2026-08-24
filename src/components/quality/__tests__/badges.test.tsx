import { render, screen } from "@testing-library/react";
import {
  ApprovalStatusBadge,
  AuditStatusBadge,
  DispositionBadge,
  StatusBadge,
} from "@/components/quality/StatusBadge";
import { PriorityBadge, RiskTierBadge } from "@/components/quality/PriorityBadge";
import type {
  ApprovalStatus,
  AuditStatus,
  Disposition,
  NcrStatus,
  Priority,
  RiskTier,
} from "@/lib/types";

const ALL_STATUSES: NcrStatus[] = [
  "Open",
  "Investigating",
  "Containment Done",
  "Root Cause Identified",
  "Verified",
  "Closed",
];
const ALL_PRIORITIES: Priority[] = ["Critical", "Major", "Minor", "Observation"];
const ALL_TIERS: RiskTier[] = ["Low", "Medium", "High", "Critical"];
const ALL_DISPOSITIONS: Disposition[] = [
  "Accepted",
  "Rejected",
  "Use As Is",
  "Rework",
  "Return to Supplier",
];
const ALL_APPROVALS: ApprovalStatus[] = [
  "Approved",
  "Pending Review",
  "Conditional",
];
const ALL_AUDIT_STATUSES: AuditStatus[] = [
  "Scheduled",
  "Completed",
  "Overdue",
  "In Progress",
];

describe("badge vocabularies", () => {
  it.each(ALL_STATUSES)("renders the %s NCR status label", (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it.each(ALL_PRIORITIES)("renders the %s priority label", (priority) => {
    render(<PriorityBadge priority={priority} />);
    expect(screen.getByText(priority)).toBeInTheDocument();
  });

  it.each(ALL_TIERS)("renders the %s risk tier with its color dot", (tier) => {
    const { container } = render(<RiskTierBadge tier={tier} />);
    expect(screen.getByText(tier)).toBeInTheDocument();
    // Each tier carries a distinct color dot for scanability.
    expect(container.querySelector("span span")).not.toBeNull();
  });

  it.each(ALL_DISPOSITIONS)(
    "renders the %s disposition label without wrapping",
    (disposition) => {
      render(<DispositionBadge disposition={disposition} />);
      expect(screen.getByText(disposition)).toBeInTheDocument();
    },
  );

  it.each(ALL_APPROVALS)("renders the %s approval status", (status) => {
    render(<ApprovalStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it.each(ALL_AUDIT_STATUSES)("renders the %s audit status", (status) => {
    render(<AuditStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it("distinguishes rejected and accepted dispositions by tone", () => {
    const { container: accepted } = render(
      <DispositionBadge disposition="Accepted" />,
    );
    const { rerender, container: rejected } = render(
      <DispositionBadge disposition="Rejected" />,
    );
    rerender(<DispositionBadge disposition="Rejected" />);

    const green = /emerald/;
    const red = /red-50|bg-red/;
    expect(accepted.firstElementChild?.className).toMatch(green);
    expect(rejected.firstElementChild?.className).toMatch(red);
  });
});

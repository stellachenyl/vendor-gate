export type RiskTier = "Low" | "Medium" | "High" | "Critical";

export type Priority = "Critical" | "Major" | "Minor" | "Observation";

export type NcrStatus =
  | "Open"
  | "Investigating"
  | "Containment Done"
  | "Root Cause Identified"
  | "Verified"
  | "Closed";

export type Disposition =
  | "Accepted"
  | "Rejected"
  | "Use As Is"
  | "Rework"
  | "Return to Supplier";

export type AqlLevel = "0.65" | "1.0" | "1.5" | "2.5" | "4.0";

export type SupplierCategory =
  | "Machining"
  | "Plastics"
  | "Electronics"
  | "Packaging"
  | "Raw Material";

export type SupplierStatus = "Active" | "Inactive";

export type Trend = "improving" | "stable" | "declining";

export interface KpiScores {
  quality: number;
  delivery: number;
  responsiveness: number;
  documentation: number;
  pricing: number;
}

export type KpiWeights = KpiScores;

export interface Supplier {
  id: string;
  name: string;
  code: string;
  category: SupplierCategory;
  riskTier: RiskTier;
  /** Rolling 90-day goods-in pass rate, percent. */
  passRate: number;
  openNcrs: number;
  lastAuditDate: string | null;
  status: SupplierStatus;
  trend: Trend;
  contactName: string;
  contactEmail: string;
  phone: string;
  location: string;
  overallScore: number;
  kpis: KpiScores;
  weights: KpiWeights;
  approvedSince: string;
  onTimeDeliveryPct: number;
  ppmDefects: number;
}

export interface InspectionRecord {
  id: string;
  lotNumber: string;
  partNumber: string;
  partName: string;
  supplierId: string;
  poNumber: string;
  receivedDate: string;
  inspectedBy: string;
  sampleSize: number;
  lotQuantity: number;
  passCount: number;
  failCount: number;
  aqlLevel: AqlLevel;
  disposition: Disposition;
  inspectorNotes: string;
}

export interface NcrStep {
  step: string;
  label: string;
  done: boolean;
}

export interface CorrectiveAction {
  id: string;
  action: string;
  owner: string;
  dueDate: string;
  status: "Planned" | "In Progress" | "Done";
}

export interface ActivityEntry {
  date: string;
  actor: string;
  event: string;
}

export interface SignOff {
  by: string;
  date: string;
}

export interface NonConformanceReport {
  id: string;
  supplierId: string;
  partNumber: string;
  lotNumber?: string;
  title: string;
  defectDescription: string;
  priority: Priority;
  status: NcrStatus;
  raisedDate: string;
  raisedBy: string;
  assignedEngineer: string;
  rootCauseCategory?: string;
  containmentAction: string;
  containmentEvidence: string[];
  rootCause: string;
  eightDTeam: string[];
  correctiveActions: CorrectiveAction[];
  verification?: SignOff;
  closure?: SignOff;
  quantityAffected: number;
  costImpactUsd: number;
  eightDProgress: NcrStep[];
  activityLog: ActivityEntry[];
}

export type DocType = "Certificate" | "PPAP" | "Audit Report" | "SOP";

export type ApprovalStatus = "Approved" | "Pending" | "Rejected";

export interface VaultDocument {
  id: string;
  name: string;
  docType: DocType;
  supplierId: string;
  version: string;
  uploadedDate: string;
  uploadedBy: string;
  approvalStatus: ApprovalStatus;
  fileType: "pdf" | "xlsx" | "docx";
  sizeKb: number;
}

export type AuditType =
  | "System Audit"
  | "Process Audit"
  | "Product Audit"
  | "Surveillance Audit";

export type AuditStatus = "Scheduled" | "Completed" | "Overdue" | "In Progress";

export interface AuditEntry {
  id: string;
  type: AuditType;
  auditor: string;
  location: string;
  date: string; // ISO date
  status: AuditStatus;
  supplierId?: string;
  findingsSummary?: string;
  closureStatus?: "Closed" | "Open";
}

export interface DashboardStats {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  avgPassRate: number;
  activeNcrs: number;
  majorNcrs: number;
  minorNcrs: number;
  overdueCorrectiveActions: number;
  upcomingAudits: number;
}

export type UserRole = "Quality Manager" | "Supplier User";

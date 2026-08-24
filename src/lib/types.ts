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
  "Accepted" | "Rejected" | "Use As Is" | "Rework" | "Return to Supplier";

export type AqlLevel = "0.65" | "1.0" | "1.5" | "2.5" | "4.0";

export interface KpiScores {
  quality: number;
  delivery: number;
  responsiveness: number;
  documentation: number;
}

export type KpiWeights = KpiScores;

export interface Supplier {
  id: string;
  name: string;
  code: string;
  riskTier: RiskTier;
  partCategory: string;
  contactEmail: string;
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

export interface NonConformanceReport {
  id: string;
  supplierId: string;
  partNumber: string;
  title: string;
  defectDescription: string;
  priority: Priority;
  status: NcrStatus;
  raisedDate: string;
  raisedBy: string;
  containmentAction: string;
  rootCause: string;
  quantityAffected: number;
  costImpactUsd: number;
  eightDProgress: NcrStep[];
}

export type ApprovalStatus = "Approved" | "Pending Review" | "Conditional";

export interface VaultDocument {
  id: string;
  name: string;
  version: string;
  uploadedDate: string;
  uploadedBy: string;
  approvalStatus: ApprovalStatus;
  fileType: "pdf" | "xlsx" | "docx";
  sizeKb: number;
}

export type AuditType =
  "System Audit" | "Process Audit" | "Product Audit" | "Surveillance Audit";

export type AuditStatus = "Scheduled" | "Completed" | "Overdue" | "In Progress";

export interface AuditEntry {
  id: string;
  type: AuditType;
  auditor: string;
  location: string;
  date: string; // ISO date
  status: AuditStatus;
  supplierId?: string;
}

export interface DashboardStats {
  totalSuppliers: number;
  activeNcrs: number;
  avgPassRate: number;
  overdueCorrectiveActions: number;
}

export type UserRole = "Quality Manager" | "Supplier User";

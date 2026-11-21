export type Category =
  | "Roads" | "Waste" | "Water" | "Electricity"
  | "Trees" | "Drainage" | "Other";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type Department =
  | "Roads & Infrastructure Department"
  | "Solid Waste Management"
  | "Water Supply & Sewerage Board"
  | "Electrical & Street Lighting Department"
  | "Parks & Tree Management"
  | "Storm Water Drainage Department"
  | "General Grievance Cell";

export type TriageSource = "ai" | "fallback";

export interface Ticket {
  id: string;                    // crypto.randomUUID()
  createdAt: string;             // ISO 8601
  originalText: string;          // exactly what the citizen typed
  detectedLanguage: string;      // e.g. "Kannada", "Hindi", "English"
  englishSummary: string;        // <= 25 words
  category: Category;
  severity: Severity;
  severityReason: string;        // one sentence, <= 20 words
  department: Department;
  photoDataUrl?: string;         // downscaled JPEG data URL, optional
  photoObservation?: string;     // what the AI saw in the photo, optional
  needsManualReview: boolean;    // true when AI is unsure or fallback was used
  source: TriageSource;          // "ai" or "fallback"
  isSeed?: boolean;              // true for demo tickets
}

export const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 0, High: 1, Medium: 2, Low: 3,
};

// Sort: severity rank ascending, then createdAt ascending (longest-waiting first)

export const DEPARTMENT_BY_CATEGORY = {
  Roads: "Roads & Infrastructure Department",
  Waste: "Solid Waste Management",
  Water: "Water Supply & Sewerage Board",
  Electricity: "Electrical & Street Lighting Department",
  Trees: "Parks & Tree Management",
  Drainage: "Storm Water Drainage Department",
  Other: "General Grievance Cell",
} as const satisfies Record<Category, Department>;

export const STATUSES = ["New", "In Progress", "Resolved"] as const;
export type Status = typeof STATUSES[number];
export type ManagedTicket = Ticket & { status: Status; officerAdjusted: boolean };
export type OfficerEdit = Partial<Pick<ManagedTicket, "status" | "department" | "severity">>;

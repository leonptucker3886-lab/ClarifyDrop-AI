export interface Order {
  id: string;
  email: string;
  yourPerspective: string;
  firstTime: string;
  violence: string;
  desiredResolution: string;
  previousAttempts: string;
  theirPerspective: string;
  status: "pending" | "paid" | "completed";
  paypalOrderId?: string;
  createdAt: number;
}

export interface AnalysisResult {
  agreements: string[];
  discrepancies: { yourVersion: string; theirVersion: string; explanation: string }[];
  summary: string;
  navigationScript: string;
  solo_note?: string;
  resolution_gaps?: string[];
  perception_gaps?: string[];
}

export const orders = new Map<string, Order>();
export const results = new Map<string, AnalysisResult>();

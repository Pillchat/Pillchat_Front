import { fetchAPI } from "@/lib/client/fetch";

export type Membership = {
  planName: string;
  passDays?: number | null;
  endDate?: string | null;
  purchaseUserId?: string;
  purchaseEnvironment?: "production" | "sandbox";
  storeProducts?: Record<string, string>;
  purchaseStatus?: "PENDING" | "CONFIRMED" | "REFUNDED";
};

export function readMembership(purchaseId?: number): Promise<Membership> {
  return fetchAPI(
    "/api/subscription/my",
    "GET",
    purchaseId === undefined ? undefined : { purchaseId },
  );
}

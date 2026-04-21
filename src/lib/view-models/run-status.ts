import type { StatusKey } from "@/lib/view-models/types";

export function normalizeRunStatusKey(status: string | null | undefined): StatusKey {
  switch (status) {
    case "completed":
    case "success":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
    case "canceled":
      return "canceled";
    case "queued":
    case "planned":
    case "observed":
      return "queued";
    default:
      return "running";
  }
}

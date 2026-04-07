export type CollaborationStatus =
  | "local_only"
  | "matched_in_snapshot"
  | "ready_to_submit"
  | "submitted"
  | "received_pending_decision"
  | "import_blocked"
  | "imported"
  | "returned";

export type ReviewStatus = "not_required" | "pending_review" | "approved" | "rejected";

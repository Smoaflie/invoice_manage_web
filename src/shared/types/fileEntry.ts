export type BindingStatus = "readable" | "unreadable" | "needs_reparse";

export type BindingErrorType =
  | "handle_missing"
  | "permission_denied"
  | "file_not_found"
  | "handle_unavailable"
  | "hash_mismatch"
  | null;

export interface FileEntry {
  id: string;
  contentHash: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  relativePath: string;
  handleRef: string;
  bindingStatus: BindingStatus;
  bindingErrorType: BindingErrorType;
  ocrVendor: string | null;
  ocrParsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

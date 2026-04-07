import { appDb } from "../../../shared/db/appDb";
import { INVOICE_COLUMN_OPTIONS } from "../../dashboard/ui/invoiceColumnOptions";
import type { InvoiceColumnKey } from "../../dashboard/ui/invoiceColumnOptions";

const DEFAULT_INVOICE_COLUMNS: InvoiceColumnKey[] = ["invoiceNumber", "buyerName", "totalAmount", "tags", "remark", "annotation", "parseStatus", "conflictStatus"];
const SETTINGS_KEY = "ui.invoiceColumns";
const VALID_COLUMN_KEYS = new Set<InvoiceColumnKey>(INVOICE_COLUMN_OPTIONS.map((option) => option.key));

export function getDefaultInvoiceColumns() {
  return [...DEFAULT_INVOICE_COLUMNS];
}

export async function loadInvoiceTablePreferences() {
  const stored = await appDb.settings.get(SETTINGS_KEY);
  if (!Array.isArray(stored?.value) || stored.value.length === 0) {
    return getDefaultInvoiceColumns();
  }

  const validColumns = stored.value.filter((value): value is InvoiceColumnKey => typeof value === "string" && VALID_COLUMN_KEYS.has(value as InvoiceColumnKey));
  return validColumns.length > 0 ? validColumns : getDefaultInvoiceColumns();
}

export async function saveInvoiceTablePreferences(columns: InvoiceColumnKey[], now: () => string) {
  await appDb.settings.put({
    key: SETTINGS_KEY,
    value: [...columns],
    updatedAt: now(),
  });
}

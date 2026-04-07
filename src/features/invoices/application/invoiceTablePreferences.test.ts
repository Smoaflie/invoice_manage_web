import { afterAll, afterEach, describe, expect, test } from "vitest";
import { appDb } from "../../../shared/db/appDb";
import { getDefaultInvoiceColumns, loadInvoiceTablePreferences, saveInvoiceTablePreferences } from "./invoiceTablePreferences";

describe("invoiceTablePreferences", () => {
  afterEach(async () => {
    await appDb.settings.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  test("returns defaults when no preference is stored", async () => {
    expect(await loadInvoiceTablePreferences()).toEqual(getDefaultInvoiceColumns());
  });

  test("round-trips stored invoice column preferences", async () => {
    await saveInvoiceTablePreferences(["invoiceNumber", "tags"], () => "2026-03-31T00:00:00.000Z");

    expect(await loadInvoiceTablePreferences()).toEqual(["invoiceNumber", "tags"]);
    expect(await appDb.settings.get("ui.invoiceColumns")).toMatchObject({
      value: ["invoiceNumber", "tags"],
    });
  });
});

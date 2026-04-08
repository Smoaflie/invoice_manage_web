import { afterAll, afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { appDb } from "../../../shared/db/appDb";
import { UserSettingsForm } from "./UserSettingsForm";

describe("UserSettingsForm", () => {
  afterEach(async () => {
    cleanup();
    await appDb.settings.clear();
  });

  afterAll(async () => {
    appDb.close();
    await appDb.delete();
  });

  it("defaults to local and persists the configured user name", async () => {
    const user = userEvent.setup();
    render(<UserSettingsForm />);

    await waitFor(() => expect(screen.getByLabelText("使用者名字")).toHaveValue("local"));
    await user.clear(screen.getByLabelText("使用者名字"));
    await user.type(screen.getByLabelText("使用者名字"), "Alice");
    await user.click(screen.getByRole("button", { name: "保存用户设置" }));

    await screen.findByText("用户设置已保存。");
    expect(await appDb.settings.get("app.userName")).toMatchObject({ value: "Alice" });
  });
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appDb } from "../shared/db/appDb";
import { AppTopbar } from "./AppTopbar";

describe("AppTopbar", () => {
  beforeEach(async () => {
    await appDb.settings.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads and saves the user name when editing is enabled", async () => {
    await appDb.settings.put({
      key: "app.userName",
      value: "Alice",
      updatedAt: "2026-04-08T00:00:00.000Z",
    });

    const user = userEvent.setup();
    render(<AppTopbar title="配置中心" subtitle="管理 OCR 识别偏好与当前浏览器的本地优先运行配置。" showUserNameEditor />);

    await waitFor(() => expect(screen.getByLabelText("使用者名字")).toHaveValue("Alice"));
    expect(screen.getByText("A")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("使用者名字"));
    await user.type(screen.getByLabelText("使用者名字"), "Bob");
    await user.click(screen.getByRole("button", { name: "保存用户设置" }));

    await waitFor(async () => {
      expect(await appDb.settings.get("app.userName")).toMatchObject({ value: "Bob" });
    });
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

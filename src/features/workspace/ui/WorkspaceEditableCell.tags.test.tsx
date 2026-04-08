import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { WorkspaceEditableCell } from "./WorkspaceEditableCell";

const tagsField: WorkspaceFieldDefinition = {
  id: "tags",
  label: "标签",
  source: "builtin",
  type: "multi_select",
  options: [],
  visible: true,
  width: 160,
  editable: true,
};

function mockCanvasTextMeasurement() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () =>
      ({
        measureText(text: string) {
          const width = [...text].reduce((sum, char) => sum + (/[\u0000-\u00ff]/u.test(char) ? 6 : 10), 0);
          return { width } as TextMetrics;
        },
      }) as CanvasRenderingContext2D,
  );
}

describe("WorkspaceEditableCell tags", () => {
  beforeEach(() => {
    mockCanvasTextMeasurement();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  test("shows as many tags as the column can hold and opens a tag menu for truncated tags", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceEditableCell
        field={tagsField}
        value={["待报销", "差旅交通", "项目A", "四月报销"]}
        columnWidth={160}
      />,
    );

    const trigger = screen.getByRole("button", { name: "标签" });
    expect(within(trigger).getByText("待报销")).toBeInTheDocument();
    expect(within(trigger).getByText("差旅交通")).toBeInTheDocument();
    expect(within(trigger).getByText("...")).toBeInTheDocument();
    expect(within(trigger).queryByText("项目A")).toBeNull();

    await user.click(trigger);

    const menu = screen.getByRole("menu", { name: "标签" });
    expect(within(menu).getByText("待报销")).toBeInTheDocument();
    expect(within(menu).getByText("差旅交通")).toBeInTheDocument();
    expect(within(menu).getByText("项目A")).toBeInTheDocument();
    expect(within(menu).getByText("四月报销")).toBeInTheDocument();
  });

  test("shows placeholder text when the record has no tags", () => {
    render(<WorkspaceEditableCell field={tagsField} value={[]} columnWidth={160} />);

    expect(screen.getByText("空")).toBeInTheDocument();
  });
});

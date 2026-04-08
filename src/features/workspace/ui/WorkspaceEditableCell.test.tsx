import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WorkspaceFieldDefinition } from "../../../shared/types/workspaceField";
import { WorkspaceEditableCell } from "./WorkspaceEditableCell";

const stringField: WorkspaceFieldDefinition = {
  id: "itemDetail",
  label: "商品详情",
  source: "builtin",
  type: "string",
  options: [],
  visible: true,
  width: 220,
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

describe("WorkspaceEditableCell", () => {
  beforeEach(() => {
    mockCanvasTextMeasurement();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  test("shows only a truncated first-line preview and opens a floating read-only panel on click", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceEditableCell
        rowId="doc-1"
        field={stringField}
        value={"第一行内容比较长需要截断展示\n第二行\n第三行"}
      />,
    );

    expect(screen.getByRole("button", { name: /第一行内容比较长需要截断展示/ })).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("第一行内容比较长需要截断展示...");
    expect(screen.getByRole("button")).toHaveClass("editable-cell__input", "editable-cell__input--readonly", "workspace-cell-detail__trigger--inline");
    expect(screen.queryByRole("textbox", { name: "商品详情详情" })).toBeNull();

    await user.click(screen.getByRole("button"));

    const expandedTextbox = await screen.findByRole("textbox", { name: "商品详情详情" });
    expect(expandedTextbox).toHaveValue("第一行内容比较长需要截断展示\n第二行\n第三行");
    expect(expandedTextbox).toHaveAttribute("readonly");
    expect(expandedTextbox).toHaveClass("workspace-cell-detail__panel");
    expect(screen.queryByRole("dialog", { name: "商品详情详情" })).toBeNull();
  });

  test("does not open a detail dialog for short single-line strings", () => {
    render(
      <WorkspaceEditableCell
        rowId="doc-1"
        field={{ ...stringField, label: "备注" }}
        value="简短备注"
      />,
    );

    expect(screen.getByDisplayValue("简短备注")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "简短备注" })).toBeNull();
  });

  test("opens read-only multiline content in a floating panel only after explicit click", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceEditableCell
        rowId="doc-1"
        field={{ ...stringField, editable: false }}
        value={"第一行\n第二行"}
      />,
    );

    expect(screen.queryByRole("textbox", { name: "商品详情详情" })).toBeNull();

    await user.click(screen.getByRole("button", { name: /第一行/ }));

    expect(screen.getByRole("textbox", { name: "商品详情详情" })).toHaveValue("第一行\n第二行");
    expect(screen.queryByRole("dialog", { name: "商品详情详情" })).toBeNull();
  });

  test("restores the preview when focus moves away from the expanded panel", async () => {
    const user = userEvent.setup();

    render(
      <>
        <WorkspaceEditableCell
          rowId="doc-1"
          field={stringField}
          value={"第一行内容比较长需要截断展示\n第二行"}
        />
        <button type="button">其他操作</button>
      </>,
    );

    await user.click(screen.getByRole("button", { name: /第一行内容比较长需要截断展示/ }));
    expect(screen.getByRole("textbox", { name: "商品详情详情" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "其他操作" }));

    expect(screen.queryByRole("textbox", { name: "商品详情详情" })).toBeNull();
    expect(screen.getByRole("button", { name: /第一行内容比较长需要截断展示/ })).toBeInTheDocument();
  });

  test("keeps the floating panel open through the trigger blur that happens during opening", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceEditableCell
        rowId="doc-1"
        field={stringField}
        value={"第一行内容比较长需要截断展示\n第二行"}
      />,
    );

    const trigger = screen.getByRole("button", { name: /第一行内容比较长需要截断展示/ });

    await user.click(trigger);
    fireEvent.blur(trigger, { relatedTarget: null });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "商品详情详情" })).toBeInTheDocument();
    });
  });

  test("does not collapse the expanded panel on a document focus event alone", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceEditableCell
        rowId="doc-1"
        field={stringField}
        value={"第一行内容比较长需要截断展示\n第二行"}
      />,
    );

    await user.click(screen.getByRole("button", { name: /第一行内容比较长需要截断展示/ }));
    expect(screen.getByRole("textbox", { name: "商品详情详情" })).toBeInTheDocument();

    fireEvent.focusIn(document.body);

    expect(screen.getByRole("textbox", { name: "商品详情详情" })).toBeInTheDocument();
  });

  test("expands overflowing single-line text when the current field width is narrow enough", async () => {
    const user = userEvent.setup();
    const value = "这是一段非常长但是只有一行的字符串内容，需要保持和普通字符串单元格一致的显示样式";

    render(
      <>
        <WorkspaceEditableCell
          rowId="doc-1"
          field={{ ...stringField, width: 120 }}
          value={value}
        />
        <button type="button">其他操作</button>
      </>,
    );

    const trigger = screen.getByRole("button", { name: value });
    expect(trigger.textContent?.endsWith("...")).toBe(true);
    expect(trigger).toHaveClass("editable-cell__input", "editable-cell__input--readonly", "workspace-cell-detail__trigger--inline");

    await user.click(trigger);

    expect(screen.getByRole("textbox", { name: "商品详情详情" })).toHaveValue(value);

    await user.click(screen.getByRole("button", { name: "其他操作" }));

    expect(screen.queryByRole("textbox", { name: "商品详情详情" })).toBeNull();
    expect(screen.getByRole("button", { name: value }).textContent?.endsWith("...")).toBe(true);
  });

  test("keeps long single-line text read-only when the current field width is wide enough", () => {
    const value = "这是一段非常长但是只有一行的字符串内容，需要保持和普通字符串单元格一致的显示样式";

    render(
      <WorkspaceEditableCell
        rowId="doc-1"
        field={{ ...stringField, width: 800 }}
        value={value}
      />,
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: value })).toBeNull();
  });

  test("does not truncate text that still fits within the current column width", () => {
    const value = "商品名称验证点击展示内容";

    render(
      <WorkspaceEditableCell
        rowId="doc-1"
        field={{ ...stringField, width: 180 }}
        value={value}
      />,
    );

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: value })).toBeNull();
  });

  test("formats timestamp values with the Asia/Shanghai timezone", () => {
    render(
      <WorkspaceEditableCell
        rowId="doc-1"
        field={{ ...stringField, id: "createdAt", label: "创建时间", type: "number" }}
        value="2026-03-31T00:00:00.000Z"
      />,
    );

    expect(screen.getByDisplayValue("2026/3/31 08:00:00")).toBeInTheDocument();
  });
});

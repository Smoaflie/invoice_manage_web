import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { WorkspaceRecordsSurface } from "./WorkspaceRecordsSurface";

describe("WorkspaceRecordsSurface", () => {
  test("renders only the dedicated empty state when there are no groups", () => {
    render(
      <WorkspaceRecordsSurface
        allSelected={false}
        groups={[]}
        expandedGroupIds={[]}
        fields={[]}
        fieldOrder={[]}
        recordColumnWidths={{}}
        itemColumnWidths={{}}
        selectedIdSet={new Set()}
        dragActive={false}
        importLabel="文件会直接进入当前记录工作区。"
        emptyState={{
          tone: "empty",
          title: "导入数据，建立第一批票据",
          description: "当前工作台还没有记录。",
          bullets: ["先导入。"],
        }}
        onToggleSelected={() => {}}
        onToggleAll={() => {}}
        onOpenDetails={() => {}}
        onEdit={() => {}}
        onOpenPdf={() => {}}
        onDelete={() => {}}
        onReparse={() => {}}
        onToggleGroup={() => {}}
        onRecordColumnWidthsChange={() => {}}
        onItemColumnWidthsChange={() => {}}
        onDragOver={() => {}}
        onDragLeave={() => {}}
        onDrop={() => {}}
      />,
    );

    expect(screen.getByTestId("workspace-empty-state")).toBeInTheDocument();
    expect(screen.queryByText("没有匹配到记录。")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { collectDroppedFiles } from "./workspaceFileImport";

describe("collectDroppedFiles", () => {
  it("imports every dropped pdf file even when dataTransfer.items is incomplete", async () => {
    const firstFile = new File(["first"], "first.pdf", { type: "application/pdf", lastModified: 1 });
    const secondFile = new File(["second"], "second.pdf", { type: "application/pdf", lastModified: 2 });
    const firstHandle = { kind: "file", name: "first.pdf" } as FileSystemFileHandle;

    const result = await collectDroppedFiles({
      files: [firstFile, secondFile],
      items: [
        {
          kind: "file",
          getAsFile: () => firstFile,
          getAsFileSystemHandle: async () => firstHandle,
        },
      ],
    } as unknown as DataTransfer);

    expect(result).toEqual([
      { file: firstFile, handle: firstHandle },
      { file: secondFile, handle: null },
    ]);
  });

  it("collects file system handles for every dropped pdf within the same event turn", async () => {
    const firstFile = new File(["first"], "first.pdf", { type: "application/pdf", lastModified: 1 });
    const secondFile = new File(["second"], "second.pdf", { type: "application/pdf", lastModified: 2 });
    const firstHandle = { kind: "file", name: "first.pdf" } as FileSystemFileHandle;
    const secondHandle = { kind: "file", name: "second.pdf" } as FileSystemFileHandle;
    let allowHandleReads = true;

    queueMicrotask(() => {
      allowHandleReads = false;
    });

    const result = await collectDroppedFiles({
      files: [firstFile, secondFile],
      items: [
        {
          kind: "file",
          getAsFile: () => firstFile,
          getAsFileSystemHandle: async () => (allowHandleReads ? firstHandle : null),
        },
        {
          kind: "file",
          getAsFile: () => secondFile,
          getAsFileSystemHandle: async () => (allowHandleReads ? secondHandle : null),
        },
      ],
    } as unknown as DataTransfer);

    expect(result).toEqual([
      { file: firstFile, handle: firstHandle },
      { file: secondFile, handle: secondHandle },
    ]);
  });
});

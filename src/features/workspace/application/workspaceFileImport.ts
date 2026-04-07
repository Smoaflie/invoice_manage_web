import type { PickedFile } from "../../files/application/importFiles";

type FileItemWithHandle = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
};

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function collectDroppedFiles(dataTransfer: DataTransfer | null): Promise<PickedFile[]> {
  if (!dataTransfer) {
    return [];
  }

  const items = Array.from(dataTransfer.items ?? []) as FileItemWithHandle[];
  if (items.length === 0) {
    return Array.from(dataTransfer.files ?? [])
      .filter(isPdfFile)
      .map((file) => ({ file, handle: null }));
  }

  const pickedFiles: PickedFile[] = [];

  for (const item of items) {
    if (item.kind !== "file") {
      continue;
    }

    const file = item.getAsFile();
    if (!file || !isPdfFile(file)) {
      continue;
    }

    const handle = item.getAsFileSystemHandle ? await item.getAsFileSystemHandle() : null;
    pickedFiles.push({
      file,
      handle: handle?.kind === "file" ? (handle as FileSystemFileHandle) : null,
    });
  }

  return pickedFiles;
}

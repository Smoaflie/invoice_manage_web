import type { PickedFile } from "../../files/application/importFiles";

type FileItemWithHandle = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
};

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function buildFileKey(file: File) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

export async function collectDroppedFiles(dataTransfer: DataTransfer | null): Promise<PickedFile[]> {
  if (!dataTransfer) {
    return [];
  }

  const pickedFiles = new Map<string, PickedFile>();
  for (const file of Array.from(dataTransfer.files ?? [])) {
    if (!isPdfFile(file)) {
      continue;
    }

    pickedFiles.set(buildFileKey(file), { file, handle: null });
  }

  const items = Array.from(dataTransfer.items ?? []) as FileItemWithHandle[];
  if (items.length === 0) {
    return [...pickedFiles.values()];
  }

  for (const item of items) {
    if (item.kind !== "file") {
      continue;
    }

    const file = item.getAsFile();
    if (!file || !isPdfFile(file)) {
      continue;
    }

    const handle = item.getAsFileSystemHandle ? await item.getAsFileSystemHandle() : null;
    pickedFiles.set(buildFileKey(file), {
      file,
      handle: handle?.kind === "file" ? (handle as FileSystemFileHandle) : null,
    });
  }

  return [...pickedFiles.values()];
}

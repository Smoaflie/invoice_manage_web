import type { PickedFile } from "../../files/application/importFiles";

type OpenFilePicker = (options?: {
  multiple?: boolean;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}) => Promise<FileSystemFileHandle[]>;

export async function pickWorkspaceFiles(): Promise<PickedFile[]> {
  const openFilePicker = window.showOpenFilePicker as OpenFilePicker | undefined;
  if (!openFilePicker) {
    throw new Error("当前浏览器不支持文件选择器。");
  }

  const handles = await openFilePicker({
    multiple: true,
    types: [
      {
        description: "PDF 文件",
        accept: {
          "application/pdf": [".pdf"],
        },
      },
    ],
    excludeAcceptAllOption: true,
  });

  const pickedFiles: PickedFile[] = [];

  for (const handle of handles) {
    const file = await handle.getFile();
    pickedFiles.push({ file, handle });
  }

  return pickedFiles;
}

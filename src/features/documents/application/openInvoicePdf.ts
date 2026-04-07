export async function openInvoicePdf(handle: FileSystemFileHandle): Promise<void> {
  const file = await handle.getFile();
  const url = URL.createObjectURL(file);
  window.open(url, "_blank", "noopener,noreferrer");
}

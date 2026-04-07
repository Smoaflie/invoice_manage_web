function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
        return;
      }

      reject(new Error("Failed to read blob bytes"));
    });

    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read blob bytes"));
    });

    reader.readAsArrayBuffer(blob);
  });
}

export async function hashFile(file: Blob): Promise<string> {
  const bytes = await readBlobAsArrayBuffer(file);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

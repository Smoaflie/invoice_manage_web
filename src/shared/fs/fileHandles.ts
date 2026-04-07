import { appDb } from "../db/appDb";

export async function persistFileHandle(handle: FileSystemFileHandle): Promise<string> {
  const key = globalThis.crypto.randomUUID();
  await appDb.fileHandles.put({
    key,
    handle,
  });
  return key;
}

export async function getStoredHandle(key: string): Promise<FileSystemHandle | undefined> {
  return appDb.fileHandles.get(key).then((record) => record?.handle);
}

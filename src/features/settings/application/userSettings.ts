import { appDb } from "../../../shared/db/appDb";

export const DEFAULT_USER_NAME = "local";

function normalizeUserName(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : DEFAULT_USER_NAME;
}

export async function loadUserNameSetting() {
  const storedValue = await appDb.settings.get("app.userName");
  return normalizeUserName(typeof storedValue?.value === "string" ? storedValue.value : null);
}

export async function saveUserNameSetting(userName: string, now: () => string) {
  const normalizedUserName = normalizeUserName(userName);
  await appDb.settings.put({
    key: "app.userName",
    value: normalizedUserName,
    updatedAt: now(),
  });
  return normalizedUserName;
}

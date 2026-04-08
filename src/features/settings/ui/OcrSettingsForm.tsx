import { useEffect, useState, type FormEvent } from "react";
import { appDb } from "../../../shared/db/appDb";
import type { SettingsKey } from "../../../shared/types/settings";
import { getAllOcrProviderSettingKeys, getOcrProvider, getOcrProviderOptions, isOcrProviderId } from "../../ocr/providers/registry";
import type { OcrProviderCredentials, OcrProviderId } from "../../ocr/providers/types";

type OcrSettingsFormState = {
  vendor: OcrProviderId;
  values: Partial<Record<SettingsKey, string>>;
};

const EMPTY_STATE: OcrSettingsFormState = {
  vendor: "tencent",
  values: {},
};

async function loadOcrSettings(): Promise<OcrSettingsFormState> {
  const settings = await appDb.settings.toArray();
  const vendorSetting = settings.find((entry) => entry.key === "ocr.vendor");
  const values = Object.fromEntries(
    settings
      .filter((entry): entry is typeof entry & { value: string | null } => typeof entry.value === "string" || entry.value === null)
      .map((entry) => [entry.key, entry.value ?? ""]),
  ) as Partial<Record<SettingsKey, string>>;

  return {
    ...EMPTY_STATE,
    vendor: typeof vendorSetting?.value === "string" && isOcrProviderId(vendorSetting.value) ? vendorSetting.value : "tencent",
    values,
  };
}

async function saveOcrSettings(state: OcrSettingsFormState, now: () => string) {
  const updatedAt = now();
  const providerSettingKeys = getAllOcrProviderSettingKeys();

  await appDb.transaction("rw", appDb.settings, async () => {
    await Promise.all([
      appDb.settings.put({
        key: "ocr.vendor",
        value: state.vendor || null,
        updatedAt,
      }),
      appDb.settings.put({
        key: "ocr.enabled",
        value: true,
        updatedAt,
      }),
      ...providerSettingKeys.map((key) =>
        appDb.settings.put({ key, value: state.values[key] || null, updatedAt }),
      ),
    ]);
  });
}

export function OcrSettingsForm() {
  const [form, setForm] = useState(EMPTY_STATE);
  const [loadStatus, setLoadStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [testStatus, setTestStatus] = useState("");
  const [busyAction, setBusyAction] = useState<"save" | "test" | null>(null);

  const resetTransientStatus = () => {
    setSaveStatus((current) => (current === "OCR 设置已保存。" ? "" : current));
    setTestStatus("");
  };

  useEffect(() => {
    let active = true;

    void loadOcrSettings()
      .then((settings) => {
        if (!active) {
          return;
        }

        setForm({
          ...settings,
          vendor: settings.vendor,
        });
      })
      .catch(() => {
        if (active) {
          setLoadStatus("OCR 设置加载失败。");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updateField = <K extends keyof OcrSettingsFormState>(key: K, value: OcrSettingsFormState[K]) => {
    resetTransientStatus();
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateSettingValue = (key: SettingsKey, value: string) => {
    resetTransientStatus();
    setForm((current) => ({
      ...current,
      values: {
        ...current.values,
        [key]: value,
      },
    }));
  };

  const activeProvider = getOcrProvider(form.vendor);
  const busy = busyAction !== null;

  const getActiveCredentials = (): OcrProviderCredentials =>
    Object.fromEntries(
      activeProvider.getSettingsFields().map((field) => [field.id, form.values[field.settingKey] ?? ""]),
    ) as OcrProviderCredentials;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyAction("save");
    setSaveStatus("正在保存 OCR 设置...");
    setTestStatus("");

    try {
      await saveOcrSettings(form, () => new Date().toISOString());
      setSaveStatus("OCR 设置已保存。");
    } catch {
      setSaveStatus("OCR 设置保存失败。");
    } finally {
      setBusyAction(null);
    }
  };

  const handleTest = async () => {
    setBusyAction("test");
    setSaveStatus((current) => (current === "OCR 设置已保存。" ? "" : current));
    setTestStatus("正在测试 OCR 设置...");

    try {
      const result = await activeProvider.testCredentials(getActiveCredentials());
      setTestStatus(result.message);
    } catch (error) {
      setTestStatus(error instanceof Error ? error.message : "OCR 设置测试失败。");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <fieldset className="settings-form__row" disabled={busy}>
        <label>
          <span>OCR服务商</span>
          <select value={form.vendor} onChange={(event) => updateField("vendor", event.target.value as OcrProviderId)}>
            {getOcrProviderOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset className="settings-form__fields" disabled={busy}>
        {activeProvider.getSettingsFields().map((field) => (
          <label key={field.settingKey}>
            <span>{field.label}</span>
            <input value={form.values[field.settingKey] ?? ""} onChange={(event) => updateSettingValue(field.settingKey, event.target.value)} />
          </label>
        ))}
      </fieldset>

      <div className="settings-form__actions">
        <button type="submit" disabled={busy}>
          {busyAction === "save" ? "保存中..." : "保存 OCR 设置"}
        </button>
        <button type="button" className="button-secondary" onClick={handleTest} disabled={busy}>
          {busyAction === "test" ? "测试中..." : "测试"}
        </button>
      </div>
      {form.vendor === "tencent" ? (
        <p className="settings-form__copy">测试腾讯 OCR 会模拟一次真实识别调用，这将会消耗供应商侧额度。</p>
      ) : null}
      {loadStatus ? <p className="settings-form__status">{loadStatus}</p> : null}
      {saveStatus ? <p className="settings-form__status">{saveStatus}</p> : null}
      {testStatus ? <p className="settings-form__status">{testStatus}</p> : null}
    </form>
  );
}

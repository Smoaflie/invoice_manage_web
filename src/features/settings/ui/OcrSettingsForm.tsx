import { useEffect, useState, type FormEvent } from "react";
import { appDb } from "../../../shared/db/appDb";
import { hasOcrExtensionBridge, openOcrExtensionOptions } from "../../ocr/bridge/extensionBridge";
import { OCR_VENDORS } from "../../ocr/infrastructure/ocrClients";
import { OcrBridgeStatus } from "./OcrBridgeStatus";

type OcrSettingsFormState = {
  vendor: string;
  enabled: boolean;
};

const EMPTY_STATE: OcrSettingsFormState = {
  vendor: "",
  enabled: false,
};

async function loadOcrSettings(): Promise<OcrSettingsFormState> {
  const [vendorSetting, enabledSetting] = await Promise.all([
    appDb.settings.get("ocr.vendor"),
    appDb.settings.get("ocr.enabled"),
  ]);

  return {
    ...EMPTY_STATE,
    vendor: typeof vendorSetting?.value === "string" ? vendorSetting.value : "",
    enabled: typeof enabledSetting?.value === "boolean" ? enabledSetting.value : false,
  };
}

async function saveOcrSettings(state: OcrSettingsFormState, now: () => string) {
  const updatedAt = now();

  await appDb.transaction("rw", appDb.settings, async () => {
    await Promise.all([
      appDb.settings.put({
        key: "ocr.vendor",
        value: state.vendor || null,
        updatedAt,
      }),
      appDb.settings.put({
        key: "ocr.enabled",
        value: state.enabled,
        updatedAt,
      }),
      appDb.settings.put({ key: "ocr.appId", value: null, updatedAt }),
      appDb.settings.put({ key: "ocr.apiKey", value: null, updatedAt }),
      appDb.settings.put({ key: "ocr.secretKey", value: null, updatedAt }),
    ]);
  });
}

export function OcrSettingsForm() {
  const [form, setForm] = useState(EMPTY_STATE);
  const [status, setStatus] = useState("正在加载 OCR 设置...");
  const [bridgeConnected, setBridgeConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [bridgeBusy, setBridgeBusy] = useState(false);

  const refreshBridgeStatus = async () => {
    setBridgeBusy(true);

    try {
      const connected = await hasOcrExtensionBridge();
      setBridgeConnected(connected);
      setStatus(connected ? "OCR 扩展已连接。" : "未检测到 OCR 扩展连接。");
    } catch {
      setBridgeConnected(false);
      setStatus("未检测到 OCR 扩展连接。");
    } finally {
      setBridgeBusy(false);
    }
  };

  useEffect(() => {
    let active = true;

    void loadOcrSettings()
      .then((settings) => {
        if (!active) {
          return;
        }

        setForm(settings);
        setStatus("OCR 设置已加载。");
      })
      .catch(() => {
        if (active) {
          setStatus("OCR 设置加载失败。");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void hasOcrExtensionBridge()
      .then((connected) => {
        if (active) {
          setBridgeConnected(connected);
        }
      })
      .catch(() => {
        if (active) {
          setBridgeConnected(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updateField = <K extends keyof OcrSettingsFormState>(key: K, value: OcrSettingsFormState[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setStatus("正在保存 OCR 设置...");

    try {
      await saveOcrSettings(form, () => new Date().toISOString());
      setStatus("OCR 设置已保存。");
    } catch {
      setStatus("OCR 设置保存失败。");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenExtensionOptions = async () => {
    setBridgeBusy(true);
    setStatus("正在打开扩展设置页...");

    try {
      await openOcrExtensionOptions();
      setStatus("扩展设置页已打开。请在扩展页面填写并测试密钥。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "无法打开扩展设置页。");
    } finally {
      setBridgeBusy(false);
    }
  };

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <OcrBridgeStatus connected={bridgeConnected} />
      <p className="settings-form__copy">OCR 密钥由浏览器扩展统一管理。请先打开扩展设置页填写并测试密钥。</p>
      <div className="settings-form__actions">
        <button type="button" onClick={() => void handleOpenExtensionOptions()} disabled={busy || bridgeBusy}>
          打开扩展设置
        </button>
        <button type="button" className="button-secondary" onClick={() => void refreshBridgeStatus()} disabled={busy || bridgeBusy}>
          {bridgeBusy ? "检查中..." : "重新检查连接"}
        </button>
      </div>

      <fieldset className="settings-form__fields" disabled={busy}>
        <label>
          <span>OCR 供应商</span>
          <select value={form.vendor} onChange={(event) => updateField("vendor", event.target.value)}>
            <option value="">请选择供应商</option>
            {OCR_VENDORS.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => updateField("enabled", event.target.checked)}
          />
          启用 OCR
        </label>
      </fieldset>

      <button type="submit" disabled={busy}>
        {busy ? "保存中..." : "保存 OCR 设置"}
      </button>
      <p className="settings-form__status">{status}</p>
    </form>
  );
}

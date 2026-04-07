export type SettingsKey =
  | "ocr.vendor"
  | "ocr.enabled"
  | "ocr.appId"
  | "ocr.apiKey"
  | "ocr.secretKey"
  | "app.theme"
  | "app.lastOpenedFolder"
  | "ui.invoiceColumns"
  | "ui.activeInvoiceViewId"
  | "ui.activeFileViewId"
  | "ui.dashboardInvoiceViewId"
  | "ui.activeWorkspaceViewId"
  | "ui.workspaceSelectedIds";

export interface SettingsValueMap {
  "ocr.vendor": string | null;
  "ocr.enabled": boolean;
  "ocr.appId": string | null;
  "ocr.apiKey": string | null;
  "ocr.secretKey": string | null;
  "app.theme": "system" | "light" | "dark";
  "app.lastOpenedFolder": string | null;
  "ui.invoiceColumns": string[];
  "ui.activeInvoiceViewId": string | null;
  "ui.activeFileViewId": string | null;
  "ui.dashboardInvoiceViewId": string | null;
  "ui.activeWorkspaceViewId": string | null;
  "ui.workspaceSelectedIds": string[];
}

export type SettingsValue<K extends SettingsKey = SettingsKey> = SettingsValueMap[K];

type SettingRecordMap = {
  [K in SettingsKey]: {
    key: K;
    value: SettingsValueMap[K];
    updatedAt: string;
  };
};

export type SettingRecord = SettingRecordMap[SettingsKey];

export type AppSettings = {
  ocr: {
    vendor: string | null;
    enabled: boolean;
    appId: string | null;
    apiKey: string | null;
    secretKey: string | null;
  };
  app: {
    theme: "system" | "light" | "dark";
    lastOpenedFolder: string | null;
  };
  ui: {
    invoiceColumns: string[];
    activeInvoiceViewId: string | null;
    activeFileViewId: string | null;
    dashboardInvoiceViewId: string | null;
    activeWorkspaceViewId: string | null;
    workspaceSelectedIds: string[];
  };
};

export type OcrSettings = AppSettings["ocr"];
export type AppSettingsGroup = AppSettings["app"];

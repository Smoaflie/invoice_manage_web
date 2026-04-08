export type SettingsKey =
  | "ocr.vendor"
  | "ocr.enabled"
  | "ocr.baiduApiKey"
  | "ocr.baiduSecretKey"
  | "ocr.tencentSecretId"
  | "ocr.tencentSecretKey"
  | "app.theme"
  | "app.userName"
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
  "ocr.baiduApiKey": string | null;
  "ocr.baiduSecretKey": string | null;
  "ocr.tencentSecretId": string | null;
  "ocr.tencentSecretKey": string | null;
  "app.theme": "system" | "light" | "dark";
  "app.userName": string;
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
    baiduApiKey: string | null;
    baiduSecretKey: string | null;
    tencentSecretId: string | null;
    tencentSecretKey: string | null;
  };
  app: {
    theme: "system" | "light" | "dark";
    userName: string;
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

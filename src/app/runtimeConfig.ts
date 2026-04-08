export const appVariant = import.meta.env.VITE_APP_VARIANT ?? "default";

export const isDemoBuild = appVariant === "demo";

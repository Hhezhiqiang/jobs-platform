import { getRequestConfig } from "next-intl/server";
import en from "../messages/en.json";
import zh from "../messages/zh.json";
import enDashboard from "../messages/en/dashboard.json";
import zhDashboard from "../messages/zh/dashboard.json";

// Merge namespaced message files into a single tree so `useTranslations("dashboard")` works.
const messages: Record<string, Record<string, unknown>> = {
  en: { ...en, dashboard: enDashboard },
  zh: { ...zh, dashboard: zhDashboard },
};

const LOCALES = ["zh", "en"] as const;
const DEFAULT_LOCALE = "zh";

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale can be `undefined` for static prerendering of locale-agnostic
  // routes (sitemap.xml, opengraph-image, etc.) — fall back to default to
  // avoid `MISSING_MESSAGE` / "No messages found" SSR errors.
  let locale = await requestLocale;
  if (!locale || !(LOCALES as readonly string[]).includes(locale)) {
    locale = DEFAULT_LOCALE;
  }
  return {
    locale,
    messages: messages[locale],
  };
});

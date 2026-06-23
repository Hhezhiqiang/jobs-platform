import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import en from "../messages/en.json";
import zh from "../messages/zh.json";
import enDashboard from "../messages/en/dashboard.json";
import zhDashboard from "../messages/zh/dashboard.json";

// Merge namespaced message files into a single tree so `useTranslations("dashboard")` works.
// The double-cast through `unknown` is necessary because home.popularSearches /
// locations are string[] (next-intl AbstractIntlMessages disallows arrays at
// type level, even though it accepts them at runtime as positional sub-trees).
const messages: Record<string, AbstractIntlMessages> = {
  en: { ...en, dashboard: enDashboard } as unknown as AbstractIntlMessages,
  zh: { ...zh, dashboard: zhDashboard } as unknown as AbstractIntlMessages,
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

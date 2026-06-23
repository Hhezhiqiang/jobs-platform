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

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    locale,
    messages: messages[locale as string] as any,
  };
});

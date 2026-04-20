import { getRequestConfig } from "next-intl/server";
import en from "../messages/en.json";
import zh from "../messages/zh.json";

const messages: Record<string, unknown> = { en, zh };

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    locale,
    messages: messages[locale as string] as any,
  };
});

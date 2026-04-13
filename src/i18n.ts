import { getRequestConfig } from "next-intl/server";
import en from "../messages/en.json";
import zh from "../messages/zh.json";

const messages = { en, zh };

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  return {
    locale,
    messages: messages[locale as keyof typeof messages],
  };
});

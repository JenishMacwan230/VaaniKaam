import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "hi", "gu"] as const;
export const defaultLocale = "en";
type AppLocale = (typeof locales)[number];

const resolveLocale = (locale?: string): AppLocale => {
  if (locale && locales.includes(locale as AppLocale)) {
    return locale as AppLocale;
  }
  return defaultLocale;
};

export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedLocale = resolveLocale(await requestLocale);

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});

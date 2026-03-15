import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const SUPPORTED_LOCALES = ["en", "es", "fr", "pt", "de", "ja", "zh"];
const DEFAULT_LOCALE = "en";

function parseAcceptLanguage(header: string): string {
  const locales = header
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of locales) {
    if (SUPPORTED_LOCALES.includes(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  let locale = cookieStore.get("locale")?.value;

  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    const acceptLang = headerStore.get("accept-language") || "";
    locale = parseAcceptLanguage(acceptLang);
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "fr", "pt", "de", "ja", "zh"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: true,
});

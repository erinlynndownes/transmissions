import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

type Route = {
  path: "" | "/talk" | "/explore";
  priority: number;
  changeFrequency: "daily" | "monthly";
};

const ROUTES: Route[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/talk", priority: 0.8, changeFrequency: "monthly" },
  { path: "/explore", priority: 0.9, changeFrequency: "daily" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of ROUTES) {
    for (const locale of routing.locales) {
      // With localePrefix: 'as-needed', the default locale (en) gets bare URLs.
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      entries.push({
        url: `https://transmissions.earth${prefix}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  return entries;
}

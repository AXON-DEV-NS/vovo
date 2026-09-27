import { defineRouting } from "next-intl/routing";

export const locales = ["en"] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Routing = typeof routing;

import { getTranslations } from "next-intl/server";
import { type Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy");

  return (
    <div className="section-padding">
      <div className="container-page max-w-3xl">
        <h1 className="display mb-2 text-display-md">{t("title")}</h1>
        <p className="mb-8 text-sm text-ink-faint">{t("lastUpdated")}</p>
        <div className="prose prose-surface max-w-none">
          <p className="text-ink-soft leading-relaxed mb-8">{t("intro")}</p>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="mb-8">
              <h2 className="mb-3 font-display text-xl font-semibold text-ink">{t(`sections.${i}.heading`)}</h2>
              <p className="text-ink-soft leading-relaxed">{t(`sections.${i}.content`)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

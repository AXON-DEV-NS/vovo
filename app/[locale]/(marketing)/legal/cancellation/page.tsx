import { getTranslations } from "next-intl/server";
import { type Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.cancellation");
  return {
    title: `${t("title")} | VOVO Agent AI`,
    description: t("intro"),
  };
}

export default async function CancellationPage() {
  const t = await getTranslations("legal.cancellation");

  return (
    <div className="section-padding">
      <div className="container-page max-w-3xl">
        <h1 className="display mb-2 text-display-md text-ink">{t("title")}</h1>
        <p className="mb-8 text-sm text-ink-faint">{t("lastUpdated")}</p>
        <div className="prose prose-surface max-w-none">
          <p className="text-ink-soft leading-relaxed mb-8 text-base">{t("intro")}</p>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-8 p-6 rounded-2xl bg-paper-high border border-line">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">
                {t(`sections.${i}.heading`)}
              </h2>
              <p className="text-ink-soft text-sm leading-relaxed">
                {t(`sections.${i}.content`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

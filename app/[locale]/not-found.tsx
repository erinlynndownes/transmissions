import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="fixed inset-3 sm:inset-4 md:inset-6 border border-[var(--foreground)]/20 rounded pointer-events-none" />
      <div className="frame-corner-tl fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6" />
      <div className="frame-corner-br fixed bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6" />

      <p className="text-3xl md:text-4xl font-light mb-8">
        {t("message")}
      </p>
      <Link
        href="/"
        className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] text-sm rounded transition-colors"
      >
        {t("back")}
      </Link>
    </main>
  );
}

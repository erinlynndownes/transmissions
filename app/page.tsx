import Link from "next/link";
import { getConversations } from "@/lib/storage";
import { RotatingQuote } from "@/components/RotatingQuote";
import { ConversationItem } from "@/lib/types";
import { getTranslations } from "next-intl/server";

const QUOTE_THRESHOLD = 10;

export const revalidate = 300;

export default async function Home() {
  const t = await getTranslations("home");

  const question = Math.random() < 0.5 ? t("question") : t("closingQuestion");

  let quotes: ConversationItem[] = [];
  try {
    const result = await getConversations({ limit: 20 });
    quotes = result.items;
  } catch {
    // DynamoDB not set up yet — show empty state
  }

  const hasEnoughQuotes = quotes.length >= QUOTE_THRESHOLD;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative pb-32">
      {/* Frame */}
      <div className="fixed inset-3 sm:inset-4 md:inset-6 border border-[var(--foreground)]/20 rounded pointer-events-none" />

      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight opacity-50 mb-10">
          {t("title")}
        </h1>

        <p className="text-3xl md:text-4xl lg:text-5xl leading-relaxed mb-8">
          {question}
        </p>

        {hasEnoughQuotes && (
          <div className="border-l border-[var(--foreground)]/20 pl-6 text-left mb-8 min-h-[80px]">
            <RotatingQuote quotes={quotes} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-64">
          <Link
            href="/talk"
            className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] text-sm rounded transition-colors"
          >
            {t("addVoice")}
          </Link>
          <Link
            href="/explore"
            className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] text-sm rounded transition-colors"
          >
            {t("seeOthers")}
          </Link>
        </div>
      </div>
    </main>
  );
}

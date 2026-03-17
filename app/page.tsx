import Link from "next/link";
import { getConversations } from "@/lib/storage";
import { RotatingQuote } from "@/components/RotatingQuote";
import { ConversationItem } from "@/lib/types";
import { getTranslations } from "next-intl/server";

const QUOTE_THRESHOLD = 10;
const CLOSING_QUESTION_PROBABILITY = 0.5;

export const revalidate = 300;

export default async function Home() {
  const t = await getTranslations("home");

  const isClosing = Math.random() < CLOSING_QUESTION_PROBABILITY;
  const question = isClosing ? t("closingQuestion") : t("question");

  let quotes: ConversationItem[] = [];
  try {
    const result = await getConversations({ limit: 20 });
    quotes = result.items;
  } catch {
    // DynamoDB not set up yet — show empty state
  }

  const hasEnoughQuotes = quotes.length >= QUOTE_THRESHOLD;

  return (
    <main id="main-content" className="min-h-screen grid grid-rows-2 relative">
      {/* Frame */}
      <div className="fixed inset-3 sm:inset-4 md:inset-6 border border-[var(--foreground)]/20 rounded pointer-events-none" />
      <div className="frame-corner-tl fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6" />
      <div className="frame-corner-br fixed bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6" />

      {/* Top half — title + question */}
      <div className={`${isClosing ? "max-w-4xl" : "max-w-2xl"} mx-auto px-6 flex flex-col items-center justify-end text-center pb-12`}>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight opacity-50 mb-10">
          {t("title")}
        </h1>

        <p className={`${isClosing ? "text-2xl md:text-3xl lg:text-4xl" : "text-3xl md:text-4xl lg:text-5xl"} leading-relaxed`}>
          {question}
        </p>
      </div>

      {/* Bottom half — quote + buttons */}
      <div className="relative flex flex-col items-center justify-center px-6">
        {hasEnoughQuotes && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-2xl w-full border-l border-[var(--foreground)]/20 pl-6 text-left h-[120px] overflow-hidden px-6">
            <RotatingQuote quotes={quotes} />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
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

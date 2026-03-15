import Link from "next/link";
import { getConversations } from "@/lib/storage";
import { RotatingQuote } from "@/components/RotatingQuote";
import { ConversationItem } from "@/lib/types";

const QUOTE_THRESHOLD = 10;

export const revalidate = 300;

export default async function Home() {
  let quotes: ConversationItem[] = [];
  try {
    const result = await getConversations({ limit: 20 });
    quotes = result.items;
  } catch {
    // DynamoDB not set up yet — show empty state
  }

  const hasEnoughQuotes = quotes.length >= QUOTE_THRESHOLD;

  return (
    <main className="min-h-screen flex items-center justify-center relative">
      {/* Frame */}
      <div className="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-[100px] border border-[var(--foreground)]/20 rounded pointer-events-none" />

      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center gap-12">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight">
          transmissions
        </h1>

        <div className="min-h-[80px]">
          {hasEnoughQuotes ? (
            <div className="border-l border-[var(--foreground)]/20 pl-6 text-left">
              <RotatingQuote quotes={quotes} />
            </div>
          ) : (
            <p className="text-2xl md:text-3xl opacity-50 leading-relaxed">
              How do you feel about AI?
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/talk"
            className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] text-sm rounded transition-colors"
          >
            Add your voice
          </Link>
          <Link
            href="/explore"
            className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] text-sm rounded transition-colors"
          >
            See others
          </Link>
        </div>
      </div>
    </main>
  );
}

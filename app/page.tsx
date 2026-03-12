import Link from "next/link";
import { getQuotes } from "@/lib/storage";
import { RotatingQuote } from "@/components/RotatingQuote";
import { QuoteRecord } from "@/lib/types";

export const revalidate = 300; // refresh quotes every 5 min

export default async function Home() {
  let quotes: QuoteRecord[] = [];
  try {
    quotes = await getQuotes();
  } catch {
    // DynamoDB not set up yet — show empty state
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col gap-16">
        <div>
          <h1 className="text-sm uppercase tracking-widest text-neutral-500 mb-2">
            transmissions
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed">
            People saying what they feel about AI. Anonymous, honest, recorded.
          </p>
        </div>

        {quotes.length > 0 && (
          <div className="border-l border-neutral-700 pl-6">
            <RotatingQuote quotes={quotes} />
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Link
            href="/talk"
            className="inline-block px-6 py-3 bg-neutral-100 hover:bg-white text-neutral-900 text-sm rounded transition-colors w-fit"
          >
            Add your voice
          </Link>
          {quotes.length > 0 && (
            <Link
              href="/explore"
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Read what others have said →
            </Link>
          )}
        </div>

        <p className="text-neutral-700 text-xs">
          Conversations are stored anonymously. By submitting, you give
          permission to display your words here.
        </p>
      </div>
    </main>
  );
}

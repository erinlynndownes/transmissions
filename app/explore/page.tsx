import { getConversations } from "@/lib/storage";
import { Category, ConversationItem } from "@/lib/types";
import Link from "next/link";

export const revalidate = 300;

const CATEGORIES: Category[] = [
  "fear", "hope", "grief", "excitement", "anger",
  "uncertainty", "displacement", "wonder", "other",
];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category as Category | undefined;

  let quotes: ConversationItem[] = [];
  try {
    const result = await getConversations({
      category,
      limit: 20,
    });
    quotes = result.items;
  } catch {
    // DynamoDB not set up yet
  }

  return (
    <main className="min-h-screen text-neutral-100">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
            &larr; transmissions
          </Link>
        </div>

        <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-8">
          What people are saying
        </h2>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/explore"
            className={`px-3 py-1 rounded text-xs transition-colors ${
              !category
                ? "bg-neutral-200 text-neutral-900"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            all
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/explore?category=${cat}`}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                category === cat
                  ? "bg-neutral-200 text-neutral-900"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Quotes */}
        {quotes.length === 0 ? (
          <p className="text-neutral-600 text-sm">No transmissions yet.</p>
        ) : (
          <div className="space-y-8">
            {quotes.map((q) => (
              <div key={q.id} className="border-l border-neutral-700 pl-5">
                <blockquote className="text-neutral-300 leading-relaxed italic mb-2">
                  &ldquo;{q.quote}&rdquo;
                </blockquote>
                <div className="flex gap-2">
                  {q.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs text-neutral-600 bg-neutral-800/50 px-2 py-0.5 rounded"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { getConversations, getStats } from "@/lib/storage";
import { ConversationItem } from "@/lib/types";
import { ExploreLayout } from "@/components/ExploreLayout";
import { InfoButton } from "@/components/InfoButton";

export const metadata: Metadata = {
  title: "explore — transmissions",
  description: "Browse anonymous conversations about AI — what people really think and feel.",
  openGraph: {
    title: "explore — transmissions",
    description: "Browse anonymous conversations about AI — what people really think and feel.",
  },
};

const EXPLORE_PAGE_SIZE = 50;

export const revalidate = 300;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: initialConversationId } = await searchParams;
  let quotes: ConversationItem[] = [];
  let stats: Record<string, Record<string, number>> = {};

  try {
    const [quotesResult, statsResult] = await Promise.all([
      getConversations({ limit: EXPLORE_PAGE_SIZE }),
      getStats(),
    ]);
    quotes = quotesResult.items;
    stats = statsResult;
  } catch {
    // DynamoDB not set up yet
  }

  return (
    <>
      <div className="hidden md:block">
        <InfoButton />
      </div>
      <ExploreLayout quotes={quotes} stats={stats} initialConversationId={initialConversationId} />
    </>
  );
}

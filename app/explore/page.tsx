import { getConversations, getStats } from "@/lib/storage";
import { ConversationItem } from "@/lib/types";
import { ExploreLayout } from "@/components/ExploreLayout";
import { InfoButton } from "@/components/InfoButton";

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
      <InfoButton />
      <ExploreLayout quotes={quotes} stats={stats} initialConversationId={initialConversationId} />
    </>
  );
}

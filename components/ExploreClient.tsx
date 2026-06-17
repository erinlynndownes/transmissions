"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationItem } from "@/lib/types";
import { ExploreLayout } from "./ExploreLayout";
import { ExploreLoading } from "./ExploreLoading";

type Stats = Record<string, Record<string, number>>;
type ConversationsResponse = { items: ConversationItem[]; cursor?: string };

const PAGE_SIZE = 50;

export function ExploreClient() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("id") ?? undefined;

  const [quotes, setQuotes] = useState<ConversationItem[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch(`/api/conversations?limit=${PAGE_SIZE}`, { signal: controller.signal }),
      fetch("/api/stats", { signal: controller.signal }),
    ])
      .then(async ([conversationsRes, statsRes]) => {
        if (!conversationsRes.ok || !statsRes.ok) {
          throw new Error("fetch_failed");
        }
        const [conversationsData, statsData] = (await Promise.all([
          conversationsRes.json(),
          statsRes.json(),
        ])) as [ConversationsResponse, Stats];
        setQuotes(conversationsData.items);
        setStats(statsData);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        // Match prior behavior: on failure, render the empty state rather than block the UI.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <ExploreLoading />;
  }

  return (
    <ExploreLayout
      quotes={quotes}
      stats={stats}
      initialConversationId={initialConversationId}
    />
  );
}

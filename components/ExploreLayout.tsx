"use client";

import { useState } from "react";
import Link from "next/link";
import { ConversationItem, Category } from "@/lib/types";
import { ExploreQuotes } from "./ExploreQuotes";
import { ExploreStats } from "./ExploreStats";

type Panel = "quotes" | "stats" | null;
type Stats = Record<string, Record<string, number>>;

export function ExploreLayout({
  quotes,
  stats,
}: {
  quotes: ConversationItem[];
  stats: Stats;
}) {
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const handlePanelClick = (panel: "quotes" | "stats") => {
    // If this panel is already active, do nothing. Only expand or switch.
    if (activePanel === panel) return;
    setActivePanel(panel);
  };

  const quotesWidth =
    activePanel === "quotes" ? "w-3/4" : activePanel === "stats" ? "w-1/4" : "w-1/2";
  const statsWidth =
    activePanel === "stats" ? "w-3/4" : activePanel === "quotes" ? "w-1/4" : "w-1/2";

  return (
    <main className="h-screen flex flex-col overflow-hidden overscroll-none">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <Link
          href="/"
          className="text-xs text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition-colors"
        >
          &larr; transmissions
        </Link>
      </div>

      {/* Panels */}
      <div className="flex-1 flex gap-6 px-6 pb-6 min-h-0">
        {/* Quotes panel */}
        <div
          className={`${quotesWidth} transition-all duration-500 ease-in-out cursor-pointer rounded-l border border-[var(--foreground)]/10 p-6 overflow-y-auto overscroll-contain`}
          onClick={(e) => {
            // Don't toggle panel if clicking an interactive element inside
            if ((e.target as HTMLElement).closest("button, select")) return;
            handlePanelClick("quotes");
          }}
        >
          <ExploreQuotes
            quotes={quotes}
            collapsed={activePanel === "stats"}
            activeCategory={activeCategory}
            onCategoryChange={(cat) => {
              setActiveCategory(cat);
              if (activePanel !== "quotes") setActivePanel("quotes");
            }}
          />
        </div>

        {/* Stats panel */}
        <div
          className={`${statsWidth} transition-all duration-500 ease-in-out cursor-pointer rounded-r border border-[var(--foreground)]/10 p-6 overflow-y-auto overscroll-contain`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button, select")) return;
            handlePanelClick("stats");
          }}
        >
          <ExploreStats
            stats={stats}
            collapsed={activePanel === "quotes"}
          />
        </div>
      </div>
    </main>
  );
}

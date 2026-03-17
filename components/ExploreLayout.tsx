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
  const [activePanel, setActivePanel] = useState<Panel>("quotes");
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
    <main id="main-content" className="h-screen flex flex-col overflow-hidden overscroll-none">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <Link
          href="/"
          className="text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 transition-colors"
        >
          &larr; transmissions
        </Link>
      </div>

      {/* Panels */}
      <div className="flex-1 flex gap-6 px-6 pb-6 min-h-0">
        {/* Quotes panel */}
        <div
          className={`${quotesWidth} relative transition-all duration-500 ease-in-out cursor-pointer rounded-l border border-[var(--foreground)]/10 p-6 overflow-y-auto overscroll-contain`}
          role="button"
          tabIndex={0}
          aria-label={activePanel === "quotes" ? "Quotes panel (expanded)" : "Expand quotes panel"}
          onClick={(e) => {
            // Don't toggle panel if clicking an interactive element inside
            if ((e.target as HTMLElement).closest("button, select, input, svg")) return;
            handlePanelClick("quotes");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePanelClick("quotes");
            }
          }}
        >
          <div className="frame-corner-tl absolute top-0 left-0" />
          <div className="frame-corner-br absolute bottom-0 right-0" />
          <ExploreQuotes
            quotes={quotes}
            collapsed={activePanel === "stats"}
            activeCategory={activeCategory}
            onCategoryChange={(cat) => {
              setActiveCategory(cat);
              if (activePanel !== "quotes") setActivePanel("quotes");
            }}
            onExpandArchive={() => {
              if (activePanel !== "quotes") setActivePanel("quotes");
            }}
          />
        </div>

        {/* Stats panel */}
        <div
          className={`${statsWidth} transition-all duration-500 ease-in-out cursor-pointer rounded-r border border-[var(--foreground)]/10 p-6 overflow-y-auto overscroll-contain`}
          role="button"
          tabIndex={0}
          aria-label={activePanel === "stats" ? "Stats panel (expanded)" : "Expand stats panel"}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button, select, input, svg")) return;
            handlePanelClick("stats");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePanelClick("stats");
            }
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

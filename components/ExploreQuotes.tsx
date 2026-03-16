"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConversationItem, ConversationRecord, Category } from "@/lib/types";

const CATEGORIES: Category[] = [
  "fear", "hope", "grief", "excitement", "anger",
  "uncertainty", "wonder", "other",
];

export function ExploreQuotes({
  quotes,
  collapsed,
  activeCategory,
  onCategoryChange,
  activeContinent,
  onContinentChange,
  continentOptions,
}: {
  quotes: ConversationItem[];
  collapsed: boolean;
  activeCategory: Category | null;
  onCategoryChange: (cat: Category | null) => void;
  activeContinent: string | null;
  onContinentChange: (continent: string | null) => void;
  continentOptions: string[];
}) {
  const t = useTranslations("explore");
  const [selectedConversation, setSelectedConversation] = useState<ConversationRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = quotes.filter((q) => {
    if (activeCategory && !q.categories.includes(activeCategory)) return false;
    if (activeContinent && q.regionContinent !== activeContinent) return false;
    return true;
  });

  const handleQuoteClick = async (q: ConversationItem) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${q.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  // Conversation detail view
  if (selectedConversation) {
    return (
      <div className="h-full flex flex-col">
        <button
          onClick={handleBack}
          className="text-xs text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 transition-colors mb-6 self-start"
        >
          &larr; {t("back")}
        </button>

        <div className="flex-1 overflow-y-auto pr-2 space-y-5">
          {selectedConversation.messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "assistant" ? (
                <p className="text-[var(--foreground)]/50 text-sm leading-relaxed">
                  {msg.content}
                </p>
              ) : (
                <p className="text-[var(--foreground)]/90 leading-relaxed">
                  {msg.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-sm uppercase tracking-widest text-[var(--foreground)]/50 mb-6">
        {t("voices")}
      </h2>

      {/* Filters */}
      {!collapsed && (
        <div className="flex flex-wrap gap-2 mb-6">
          <select
            value={activeCategory ?? ""}
            onChange={(e) => onCategoryChange((e.target.value || null) as Category | null)}
            className="bg-[var(--foreground)]/5 text-[var(--foreground)]/60 text-xs rounded px-2 py-1 border border-[var(--foreground)]/10 cursor-pointer"
          >
            <option value="">{t("allFeelings")}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </option>
            ))}
          </select>
          <select
            value={activeContinent ?? ""}
            onChange={(e) => onContinentChange(e.target.value || null)}
            className="bg-[var(--foreground)]/5 text-[var(--foreground)]/60 text-xs rounded px-2 py-1 border border-[var(--foreground)]/10 cursor-pointer"
          >
            <option value="">{t("allContinents")}</option>
            {continentOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quotes list */}
      <div className="flex-1 overflow-y-auto pl-2 pr-2">
        {loading && (
          <p className="text-[var(--foreground)]/30 text-sm">Loading...</p>
        )}
        {!loading && filtered.length === 0 ? (
          <p className="text-[var(--foreground)]/30 text-sm">{t("noTransmissions")}</p>
        ) : !loading && (
          <div className="divide-y divide-[var(--foreground)]/5">
            {filtered.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuoteClick(q)}
                className="w-full text-left py-4 px-4 -mx-4 hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer"
              >
                <p className={`text-[var(--foreground)]/70 leading-relaxed ${collapsed ? "text-sm line-clamp-2" : "mb-2"}`}>
                  &ldquo;{q.quote}&rdquo;
                </p>
                {!collapsed && (
                  <div className="flex gap-2 mt-1">
                    {q.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs text-[var(--foreground)]/30 bg-[var(--foreground)]/5 px-2 py-0.5 rounded"
                      >
                        {t(`categories.${cat}`)}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

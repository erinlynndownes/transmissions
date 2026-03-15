"use client";

import { useTranslations } from "next-intl";
import { ConversationItem, Category } from "@/lib/types";

const CATEGORIES: Category[] = [
  "fear", "hope", "grief", "excitement", "anger",
  "uncertainty", "wonder", "other",
];

export function ExploreQuotes({
  quotes,
  collapsed,
  activeCategory,
  onCategoryChange,
}: {
  quotes: ConversationItem[];
  collapsed: boolean;
  activeCategory: Category | null;
  onCategoryChange: (cat: Category | null) => void;
}) {
  const t = useTranslations("explore");

  const filtered = activeCategory
    ? quotes.filter((q) => q.categories.includes(activeCategory))
    : quotes;

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-sm uppercase tracking-widest text-[var(--foreground)]/50 mb-6">
        {t("voices")}
      </h2>

      {/* Category filters */}
      {!collapsed && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              !activeCategory
                ? "bg-[var(--foreground)]/20 text-[var(--foreground)]"
                : "bg-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/10"
            }`}
          >
            {t("all")}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeCategory === cat
                  ? "bg-[var(--foreground)]/20 text-[var(--foreground)]"
                  : "bg-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/10"
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>
      )}

      {/* Quotes list */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {filtered.length === 0 ? (
          <p className="text-[var(--foreground)]/30 text-sm">{t("noTransmissions")}</p>
        ) : (
          filtered.map((q) => (
            <div key={q.id} className="border-l border-[var(--foreground)]/20 pl-5">
              <blockquote className={`text-[var(--foreground)]/70 leading-relaxed italic ${collapsed ? "text-sm line-clamp-2" : "mb-2"}`}>
                &ldquo;{q.quote}&rdquo;
              </blockquote>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}

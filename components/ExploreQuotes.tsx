"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ConversationItem, ConversationRecord, Category, EventTag, CATEGORIES, EVENT_TAGS } from "@/lib/types";
import { COUNTRY_NAMES, countryName } from "@/lib/geo";

export function ExploreQuotes({
  quotes,
  collapsed,
  activeCategory,
  onCategoryChange,
  onExpandArchive,
  initialConversationId,
}: {
  quotes: ConversationItem[];
  collapsed: boolean;
  activeCategory: Category | null;
  onCategoryChange: (cat: Category | null) => void;
  onExpandArchive: () => void;
  initialConversationId?: string;
}) {
  const t = useTranslations("explore");
  const [selectedConversation, setSelectedConversation] = useState<ConversationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeEventTag, setActiveEventTag] = useState<EventTag | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationFocused, setLocationFocused] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  // Map of display name → country code for all countries in the data
  const locationOptions = useMemo(() => {
    const codes = new Set<string>();
    for (const q of quotes) {
      if (q.regionCountry) codes.add(q.regionCountry);
    }
    return Array.from(codes)
      .map((code) => ({ code, name: countryName(code) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [quotes]);

  // The selected country code (what we actually filter by)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);

  const filtered = quotes.filter((q) => {
    if (activeCategory && !q.categories.includes(activeCategory)) return false;
    if (activeEventTag && !q.eventTags.includes(activeEventTag)) return false;
    if (selectedCountryCode && q.regionCountry !== selectedCountryCode) return false;
    return true;
  });

  const [revealedWarnings, setRevealedWarnings] = useState<Set<string>>(new Set());
  const [conversationWarningRevealed, setConversationWarningRevealed] = useState(false);

  useEffect(() => {
    if (!initialConversationId) return;
    onExpandArchive();
    setLoading(true);
    fetch(`/api/conversations/${initialConversationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setSelectedConversation(data); })
      .finally(() => setLoading(false));
  }, [initialConversationId]);

  const handleQuoteClick = async (q: ConversationItem) => {
    onExpandArchive();
    setConversationWarningRevealed(false);
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
    setConversationWarningRevealed(false);
  };

  // Conversation detail view
  if (selectedConversation) {
    const hasWarning = selectedConversation.extractedData?.contentWarning;

    return (
      <div className="h-full flex flex-col">
        <button
          onClick={handleBack}
          className="text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 transition-colors mb-6 self-start"
        >
          &larr; {t("back")}
        </button>

        {hasWarning && !conversationWarningRevealed ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <p className="text-[var(--foreground)]/50 text-sm">{t("contentWarning")}</p>
            <button
              onClick={() => setConversationWarningRevealed(true)}
              className="text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 transition-colors border border-[var(--foreground)]/10 px-3 py-1 rounded"
              aria-label="Show conversation with content warning"
            >
              {t("showAnyway")}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-5" lang={selectedConversation.extractedData?.language || undefined}>
            {selectedConversation.messages.map((msg, i) => (
              <div key={`${msg.role}-${i}-${msg.content.slice(0, 20)}`}>
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
            <p className="text-[10px] text-[var(--foreground)]/20 font-mono pt-4 select-all">
              {selectedConversation.id}
            </p>
          </div>
        )}
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
            aria-label={t("allMoods")}
          >
            <option value="">{t("allMoods")}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </option>
            ))}
          </select>

          <select
            value={activeEventTag ?? ""}
            onChange={(e) => setActiveEventTag((e.target.value || null) as EventTag | null)}
            className="bg-[var(--foreground)]/5 text-[var(--foreground)]/60 text-xs rounded px-2 py-1 border border-[var(--foreground)]/10 cursor-pointer"
            aria-label={t("allEvents")}
          >
            <option value="">{t("allEvents")}</option>
            {EVENT_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {t(`eventTags.${tag}`)}
              </option>
            ))}
          </select>

          <div className="relative" ref={locationRef}>
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setSelectedCountryCode(null);
                setLocationFocused(true);
              }}
              onFocus={() => setLocationFocused(true)}
              onBlur={() => setTimeout(() => setLocationFocused(false), 150)}
              placeholder={t("searchLocation")}
              aria-label={t("searchLocation")}
              role="combobox"
              aria-expanded={locationFocused && !selectedCountryCode}
              aria-controls="location-listbox"
              aria-autocomplete="list"
              className="bg-[var(--foreground)]/5 text-[var(--foreground)]/60 text-xs rounded px-2 py-1 border border-[var(--foreground)]/10 w-44 placeholder-[var(--foreground)]/50"
            />
            {selectedCountryCode && (
              <button
                onClick={() => {
                  setLocationSearch("");
                  setSelectedCountryCode(null);
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 text-xs"
                aria-label="Clear location filter"
              >
                &times;
              </button>
            )}
            {locationFocused && !selectedCountryCode && locationOptions.filter(
              (loc) => !locationSearch || loc.name.toLowerCase().includes(locationSearch.toLowerCase())
            ).length > 0 && (
              <div id="location-listbox" role="listbox" aria-label={t("searchLocation")} className="absolute top-full left-0 mt-1 w-full bg-[#1a1a1a] border border-[var(--foreground)]/10 rounded shadow-lg max-h-40 overflow-y-auto z-20">
                {locationOptions
                  .filter((loc) => !locationSearch || loc.name.toLowerCase().includes(locationSearch.toLowerCase()))
                  .map((loc) => (
                    <button
                      key={loc.code}
                      role="option"
                      aria-selected={selectedCountryCode === loc.code}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setLocationSearch(loc.name);
                        setSelectedCountryCode(loc.code);
                        setLocationFocused(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/10 cursor-pointer"
                    >
                      {loc.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotes list */}
      <div className="flex-1 overflow-y-auto pl-2 pr-2">
        {loading && (
          <p className="text-[var(--foreground)]/50 text-sm">Loading...</p>
        )}
        {!loading && filtered.length === 0 ? (
          <p className="text-[var(--foreground)]/50 text-sm">{t("noTransmissions")}</p>
        ) : !loading && (
          <div className="divide-y divide-[var(--foreground)]/5">
            {filtered.map((q) => {
              const isWarned = q.contentWarning && !revealedWarnings.has(q.id);
              return (
                <div key={q.id} className="relative py-4 px-4 -mx-4">
                  {isWarned ? (
                    <div className="flex items-center gap-3">
                      <p className="text-[var(--foreground)]/50 text-xs italic flex-1">
                        {t("contentWarning")}
                      </p>
                      <button
                        onClick={() => setRevealedWarnings((prev) => new Set(prev).add(q.id))}
                        className="text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 transition-colors border border-[var(--foreground)]/10 px-2 py-0.5 rounded shrink-0"
                        aria-label="Show quote with content warning"
                      >
                        {t("showAnyway")}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleQuoteClick(q)}
                      className="w-full text-left hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer"
                    >
                      <p className={`text-[var(--foreground)]/70 leading-relaxed ${collapsed ? "text-sm line-clamp-2" : "mb-2"}`}>
                        &ldquo;{q.quote}&rdquo;
                      </p>
                      {!collapsed && (
                        <div className="flex gap-2 mt-1">
                          {q.categories.filter((cat) => (CATEGORIES as readonly string[]).includes(cat)).map((cat) => (
                            <span
                              key={cat}
                              className="text-xs text-[var(--foreground)]/50 bg-[var(--foreground)]/5 px-2 py-0.5 rounded"
                            >
                              {t(`categories.${cat}`)}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

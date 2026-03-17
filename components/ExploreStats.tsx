"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ContinentMap } from "./ContinentMap";
import { DonutChart } from "./DonutChart";
import { FilterSelect } from "./FilterSelect";
import { CONTINENTS } from "@/lib/geo";

type Stats = Record<string, Record<string, number>>;

const CATEGORY_COLORS: Record<string, string> = {
  fear: "#b894ff",       // medium_slate_blue 700
  hope: "#8dffdb",       // mint_cream 400
  grief: "#c3bef7",      // periwinkle 500
  excitement: "#dbc09e", // soft amber
  anger: "#a070ff",      // medium_slate_blue 600
  uncertainty: "#a3bcd8",// alice_blue 400
  wonder: "#e7e6fc",     // periwinkle 800
  other: "#cccccc",      // white 400
};

const EVENT_TAG_LABELS: Record<string, string> = {
  work_affected: "work",
  health_affected: "health",
  relationships_affected: "relationships",
  creative_affected: "creative",
  education_affected: "education",
  financial_affected: "financial",
};

const BAR_COLOR = "#a3bcd8";

const GENDER_FILTER_OPTIONS = ["woman", "man", "non-binary"];

function filterCrossDimensional(
  stats: Stats,
  prefix: "category" | "eventTag",
  filters: { dim: string; value: string }[],
  fallback: Record<string, number>
): Record<string, number> {
  if (filters.length === 0) return fallback;

  const crossKey = `demo_${prefix}#${filters.map((f) => f.dim).join("#")}`;
  const crossData = stats[crossKey];
  if (!crossData) return fallback;

  const filterValue = filters.map((f) => f.value).join("#");
  const result: Record<string, number> = {};
  for (const [key, count] of Object.entries(crossData)) {
    const parts = key.split("#");
    const label = parts[0];
    const matchValue = parts.slice(1).join("#");
    if (matchValue === filterValue) {
      result[label] = (result[label] ?? 0) + count;
    }
  }
  return result;
}

export function ExploreStats({
  stats,
  collapsed,
}: {
  stats: Stats;
  collapsed: boolean;
}) {
  const t = useTranslations("explore");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [filterContinent, setFilterContinent] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterEmployment, setFilterEmployment] = useState("");

  const categories = stats.category ?? {};
  const eventTags = stats.eventTag ?? {};

  const genderOptions = useMemo(
    () => GENDER_FILTER_OPTIONS.filter((g) => (stats.demo_gender ?? {})[g] != null),
    [stats]
  );
  const ageOptions = useMemo(
    () => Object.keys(stats.demo_ageRange ?? {}).sort(),
    [stats]
  );
  const employmentOptions = useMemo(
    () => Object.keys(stats.demo_employmentStatus ?? {}).sort(),
    [stats]
  );

  const activeFilters = useMemo(() => {
    const filters: { dim: string; value: string }[] = [];
    if (filterGender) filters.push({ dim: "gender", value: filterGender });
    if (filterAge) filters.push({ dim: "ageRange", value: filterAge });
    if (filterEmployment) filters.push({ dim: "employmentStatus", value: filterEmployment });
    if (filterContinent) filters.push({ dim: "continent", value: filterContinent });
    return filters;
  }, [filterGender, filterAge, filterEmployment, filterContinent]);

  const filteredCategories = useMemo(
    () => filterCrossDimensional(stats, "category", activeFilters, categories),
    [stats, activeFilters, categories]
  );

  const filteredTotal = Object.values(filteredCategories).reduce(
    (sum, c) => sum + c,
    0
  );

  const categoryData = Object.keys(CATEGORY_COLORS)
    .map((cat) => {
      const count = filteredCategories[cat] ?? 0;
      return {
        label: cat,
        value: count,
        color: CATEGORY_COLORS[cat],
        pct: filteredTotal > 0 ? Math.round((count / filteredTotal) * 100) : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  const filteredEventTags = useMemo(
    () => filterCrossDimensional(stats, "eventTag", activeFilters, eventTags),
    [stats, activeFilters, eventTags]
  );

  const eventTagEntries = Object.keys(EVENT_TAG_LABELS)
    .map((tag) => [tag, filteredEventTags[tag] ?? 0] as [string, number])
    .sort(([, a], [, b]) => b - a);
  const totalEventCount = eventTagEntries.reduce(
    (sum, [, c]) => sum + c,
    0
  );

  const filters = (
    <div className="flex flex-wrap gap-1.5 mb-4">
      <FilterSelect
        value={filterGender}
        onChange={setFilterGender}
        label={t("filterGender")}
        allLabel={t("allGenders")}
        options={genderOptions}
      />
      <FilterSelect
        value={filterAge}
        onChange={setFilterAge}
        label={t("filterAge")}
        allLabel={t("allAges")}
        options={ageOptions}
      />
      <FilterSelect
        value={filterEmployment}
        onChange={setFilterEmployment}
        label={t("filterEmployment")}
        allLabel={t("allEmployment")}
        options={employmentOptions}
      />
      <select
        value={filterContinent}
        onChange={(e) => setFilterContinent(e.target.value)}
        className="bg-[var(--foreground)]/5 text-[var(--foreground)]/60 text-xs rounded px-2 py-1 border border-[var(--foreground)]/10 cursor-pointer"
        title={t("filterContinent")}
      >
        <option value="">{t("allContinents")}</option>
        {CONTINENTS.map((c) => (
          <option key={c} value={c}>
            {t(`continentNames.${c}`)}
          </option>
        ))}
      </select>
    </div>
  );

  if (collapsed) {
    return (
      <div className="h-full flex flex-col gap-3 pt-2 overflow-y-auto">
        {/* Compact donut */}
        <div className="flex flex-col items-center">
          {mounted && (
            <DonutChart
              data={categoryData.map((d) => ({
                label: d.label,
                value: d.value,
                color: d.color,
              }))}
              size={120}
            />
          )}
        </div>

        {/* Compact feeling legend */}
        <div className="w-full space-y-1 px-1">
          {categoryData.map((d) => (
            <div key={d.label} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color, opacity: 0.7 }}
              />
              <span className="text-[var(--foreground)]/40 truncate flex-1">
                {t(`categories.${d.label}`)}
              </span>
              <span className="text-[var(--foreground)]/30 tabular-nums">
                {d.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* Compact map */}
        {mounted && (
          <div className="w-full px-1">
            <ContinentMap
              activeContinent={filterContinent || null}
              onContinentChange={(c) => setFilterContinent(c ?? "")}
              continentCounts={stats.continent ?? {}}
            />
          </div>
        )}

        {/* Compact areas affected */}
        <div className="w-full space-y-1 px-1">
          <h3 className="text-xs uppercase tracking-widest text-[var(--foreground)]/30 mb-1">
            {t("areasAffected")}
          </h3>
          {eventTagEntries.map(([tag, count]) => {
            const pct =
              totalEventCount > 0
                ? Math.round((count / totalEventCount) * 100)
                : 0;
            return (
              <div key={tag} className="flex justify-between text-xs">
                <span className="text-[var(--foreground)]/40 truncate">
                  {EVENT_TAG_LABELS[tag] ?? tag}
                </span>
                <span className="text-[var(--foreground)]/30 tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="space-y-4">
        {/* Filters */}
        {filters}

        {/* Donut chart + legend + map */}
        <div className="flex items-center p-4 rounded border border-[var(--foreground)]/5">
          <div className="w-[calc(50%-20px)] flex items-center gap-4">
            {mounted && (
              <DonutChart
                data={categoryData.map((d) => ({
                  label: d.label,
                  value: d.value,
                  color: d.color,
                }))}
              />
            )}
            <div className="flex-1 space-y-1.5">
              {categoryData.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: d.color, opacity: 0.7 }}
                  />
                  <span className="text-[var(--foreground)]/60 flex-1">
                    {t(`categories.${d.label}`)}
                  </span>
                  <span className="text-[var(--foreground)]/40 tabular-nums">
                    {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          {mounted && (
            <div className="w-[calc(50%+20px)]">
              <ContinentMap
                activeContinent={filterContinent || null}
                onContinentChange={(c) => setFilterContinent(c ?? "")}
                continentCounts={stats.continent ?? {}}
              />
            </div>
          )}
        </div>

        {/* Life areas affected */}
        <div className="p-4 rounded border border-[var(--foreground)]/5">
          <h3 className="text-xs uppercase tracking-widest text-[var(--foreground)]/40 mb-4">
            {t("areasAffected")}
          </h3>
          <div className="space-y-3">
            {eventTagEntries.map(([tag, count]) => {
              const pct =
                totalEventCount > 0
                  ? Math.round((count / totalEventCount) * 100)
                  : 0;
              return (
                <div key={tag}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--foreground)]/60">
                      {EVENT_TAG_LABELS[tag] ?? tag}
                    </span>
                    <span className="text-[var(--foreground)]/40 tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: BAR_COLOR,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

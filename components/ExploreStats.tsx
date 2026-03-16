"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

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

function DonutChart({
  data,
  size = 160,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const radius = size / 2 - 8;
  const innerRadius = radius * 0.6;
  let currentAngle = -Math.PI / 2;

  const segments = data.map((d) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const largeArc = angle > Math.PI ? 1 : 0;
    const x1 = size / 2 + radius * Math.cos(startAngle);
    const y1 = size / 2 + radius * Math.sin(startAngle);
    const x2 = size / 2 + radius * Math.cos(endAngle);
    const y2 = size / 2 + radius * Math.sin(endAngle);
    const ix1 = size / 2 + innerRadius * Math.cos(startAngle);
    const iy1 = size / 2 + innerRadius * Math.sin(startAngle);
    const ix2 = size / 2 + innerRadius * Math.cos(endAngle);
    const iy2 = size / 2 + innerRadius * Math.sin(endAngle);

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      "Z",
    ].join(" ");

    return { ...d, path };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg) => (
        <path
          key={seg.label}
          d={seg.path}
          fill={seg.color}
          opacity={0.7}
          stroke="var(--background)"
          strokeWidth={1}
        />
      ))}
      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        fill="currentColor"
        opacity={0.7}
        fontSize={24}
        fontWeight={300}
      >
        {total}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 12}
        textAnchor="middle"
        fill="currentColor"
        opacity={0.3}
        fontSize={8}
        letterSpacing={2}
        style={{ textTransform: "uppercase" }}
      >
        TOTAL
      </text>
    </svg>
  );
}

const EVENT_TAG_LABELS: Record<string, string> = {
  work_affected: "work",
  health_affected: "health",
  relationships_affected: "relationships",
  creative_affected: "creative",
  education_affected: "education",
  financial_affected: "financial",
};

function FilterSelect({
  value,
  onChange,
  label,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  allLabel: string;
  options: string[];
}) {
  if (options.length === 0) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[var(--foreground)]/5 text-[var(--foreground)]/60 text-xs rounded px-2 py-1 border border-[var(--foreground)]/10 cursor-pointer"
      title={label}
    >
      <option value="">{allLabel}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function ExploreStats({
  stats,
  collapsed,
  activeContinent,
}: {
  stats: Stats;
  collapsed: boolean;
  activeContinent: string | null;
}) {
  const t = useTranslations("explore");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [filterGender, setFilterGender] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterEmployment, setFilterEmployment] = useState("");

  const categories = stats.category ?? {};
  const eventTags = stats.eventTag ?? {};

  const genderOptions = useMemo(
    () => Object.keys(stats.demo_gender ?? {}).sort(),
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

  // When filters are active, recompute category breakdown from cross-dimensional stats
  const filteredCategories = useMemo(() => {
    const activeFilters: { dim: string; value: string }[] = [];
    if (filterGender) activeFilters.push({ dim: "gender", value: filterGender });
    if (filterAge) activeFilters.push({ dim: "ageRange", value: filterAge });
    if (filterEmployment) activeFilters.push({ dim: "employmentStatus", value: filterEmployment });
    if (activeContinent) activeFilters.push({ dim: "continent", value: activeContinent });

    if (activeFilters.length === 0) return categories;

    // Build the stats key from active filter dimensions
    const crossKey = `demo_category#${activeFilters.map((f) => f.dim).join("#")}`;
    const crossData = stats[crossKey];
    if (!crossData) return categories;

    const filterValue = activeFilters.map((f) => f.value).join("#");
    const result: Record<string, number> = {};
    for (const [key, count] of Object.entries(crossData)) {
      const parts = key.split("#");
      const cat = parts[0];
      const matchValue = parts.slice(1).join("#");
      if (matchValue === filterValue) {
        result[cat] = (result[cat] ?? 0) + count;
      }
    }
    return result;
  }, [categories, filterGender, filterAge, filterEmployment, activeContinent, stats]);

  const filteredTotal = Object.values(filteredCategories).reduce(
    (sum, c) => sum + c,
    0
  );

  const categoryData = Object.entries(filteredCategories)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({
      label: cat,
      value: count,
      color: CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other,
      pct: filteredTotal > 0 ? Math.round((count / filteredTotal) * 100) : 0,
    }));

  const eventTagEntries = Object.entries(eventTags).sort(
    ([, a], [, b]) => b - a
  );
  const totalEventCount = eventTagEntries.reduce(
    (sum, [, c]) => sum + c,
    0
  );

  const hasAnyFilter = activeContinent || filterGender || filterAge || filterEmployment;

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

        {/* Compact summary — stacked vertically */}
        <div className="w-full space-y-2 px-1">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--foreground)]/40">{t("countries")}</span>
            <span className="text-[var(--foreground)]/60 tabular-nums">
              {Object.keys(stats.country ?? {}).length}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--foreground)]/40">{t("continents")}</span>
            <span className="text-[var(--foreground)]/60 tabular-nums">
              {Object.keys(stats.continent ?? {}).length}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--foreground)]/40">{t("feelings")}</span>
            <span className="text-[var(--foreground)]/60 tabular-nums">
              {Object.keys(categories).length}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="space-y-4">
        {/* Filters */}
        {filters}

        {hasAnyFilter && (
          <div className="text-xs text-[var(--foreground)]/30 -mt-2 mb-2">
            {(() => {
              const parts = [activeContinent, filterGender, filterAge, filterEmployment].filter(Boolean);
              return parts.length > 0
                ? `Showing category breakdown for ${parts.join(" + ")}`
                : null;
            })()}
          </div>
        )}

        {/* Donut chart + legend */}
        <div className="flex items-center gap-6 p-4 rounded border border-[var(--foreground)]/5">
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
                        backgroundColor: "#a3bcd8",
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary counts */}
        <div className="p-4 rounded border border-[var(--foreground)]/5 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-light text-[var(--foreground)]/70 tabular-nums">
              {Object.keys(stats.country ?? {}).length}
            </div>
            <div className="text-xs text-[var(--foreground)]/30 uppercase tracking-widest mt-1">
              {t("countries")}
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--foreground)]/10" />
          <div className="text-center">
            <div className="text-2xl font-light text-[var(--foreground)]/70 tabular-nums">
              {Object.keys(stats.continent ?? {}).length}
            </div>
            <div className="text-xs text-[var(--foreground)]/30 uppercase tracking-widest mt-1">
              {t("continents")}
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--foreground)]/10" />
          <div className="text-center">
            <div className="text-2xl font-light text-[var(--foreground)]/70 tabular-nums">
              {Object.keys(categories).length}
            </div>
            <div className="text-xs text-[var(--foreground)]/30 uppercase tracking-widest mt-1">
              {t("feelings")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

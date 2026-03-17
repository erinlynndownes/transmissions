"use client";

import { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { NAME_TO_CONTINENT } from "@/lib/geo";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function getContinentForGeo(geo: { properties: { name: string } }): string {
  return NAME_TO_CONTINENT[geo.properties.name] ?? "Other";
}

function ContinentMapInner({
  activeContinent,
  onContinentChange,
  continentCounts,
}: {
  activeContinent: string | null;
  onContinentChange: (continent: string | null) => void;
  continentCounts: Record<string, number>;
}) {
  const [hoveredContinent, setHoveredContinent] = useState<string | null>(null);
  const hasData = (continent: string) => (continentCounts[continent] ?? 0) > 0;

  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ scale: 130, center: [0, 0] }}
      width={600}
      height={340}
      style={{ width: "100%", height: "auto" }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const continent = getContinentForGeo(geo);
            const isActive = activeContinent === continent;
            const isHovered = hoveredContinent === continent;
            const hasAnyFilter = activeContinent !== null;
            const hasCounts = hasData(continent);

            let fillOpacity = 0.15;
            if (isActive) {
              fillOpacity = 0.5;
            } else if (isHovered) {
              fillOpacity = 0.35;
            } else if (hasAnyFilter) {
              fillOpacity = 0.08;
            } else if (hasCounts) {
              fillOpacity = 0.2;
            }

            const sharedStyle = {
              fill: "var(--foreground)",
              fillOpacity,
              stroke: "var(--foreground)",
              strokeWidth: 0.3,
              strokeOpacity: 0.1,
              outline: "none",
              cursor: "pointer",
              transition: "fill-opacity 0.2s ease",
            };

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => {
                  onContinentChange(isActive ? null : continent);
                }}
                onMouseEnter={() => setHoveredContinent(continent)}
                onMouseLeave={() => setHoveredContinent(null)}
                style={{
                  default: sharedStyle,
                  hover: sharedStyle,
                  pressed: sharedStyle,
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}

export const ContinentMap = memo(ContinentMapInner);

"use client";

import { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map country names (from world-atlas 110m topojson) to continent names used in our data
const NAME_TO_CONTINENT: Record<string, string> = {
  // Africa
  "Algeria": "Africa", "Angola": "Africa", "Benin": "Africa", "Botswana": "Africa",
  "Burkina Faso": "Africa", "Burundi": "Africa", "Cameroon": "Africa",
  "Central African Rep.": "Africa", "Chad": "Africa", "Congo": "Africa",
  "Côte d'Ivoire": "Africa", "Dem. Rep. Congo": "Africa", "Djibouti": "Africa",
  "Egypt": "Africa", "Eq. Guinea": "Africa", "Eritrea": "Africa", "eSwatini": "Africa",
  "Ethiopia": "Africa", "Gabon": "Africa", "Gambia": "Africa", "Ghana": "Africa",
  "Guinea": "Africa", "Guinea-Bissau": "Africa", "Kenya": "Africa", "Lesotho": "Africa",
  "Liberia": "Africa", "Libya": "Africa", "Madagascar": "Africa", "Malawi": "Africa",
  "Mali": "Africa", "Mauritania": "Africa", "Morocco": "Africa", "Mozambique": "Africa",
  "Namibia": "Africa", "Niger": "Africa", "Nigeria": "Africa", "Rwanda": "Africa",
  "S. Sudan": "Africa", "Senegal": "Africa", "Sierra Leone": "Africa",
  "Somalia": "Africa", "Somaliland": "Africa", "South Africa": "Africa",
  "Sudan": "Africa", "Tanzania": "Africa", "Togo": "Africa", "Tunisia": "Africa",
  "Uganda": "Africa", "W. Sahara": "Africa", "Zambia": "Africa", "Zimbabwe": "Africa",

  // Asia
  "Afghanistan": "Asia", "Armenia": "Asia", "Azerbaijan": "Asia",
  "Bangladesh": "Asia", "Bhutan": "Asia", "Brunei": "Asia", "Cambodia": "Asia",
  "China": "Asia", "Cyprus": "Asia", "N. Cyprus": "Asia", "Georgia": "Asia",
  "India": "Asia", "Indonesia": "Asia", "Iran": "Asia", "Iraq": "Asia",
  "Israel": "Asia", "Japan": "Asia", "Jordan": "Asia", "Kazakhstan": "Asia",
  "Kuwait": "Asia", "Kyrgyzstan": "Asia", "Laos": "Asia", "Lebanon": "Asia",
  "Malaysia": "Asia", "Mongolia": "Asia", "Myanmar": "Asia", "Nepal": "Asia",
  "North Korea": "Asia", "Oman": "Asia", "Pakistan": "Asia", "Palestine": "Asia",
  "Philippines": "Asia", "Qatar": "Asia", "Russia": "Asia", "Saudi Arabia": "Asia",
  "South Korea": "Asia", "Sri Lanka": "Asia", "Syria": "Asia", "Taiwan": "Asia",
  "Tajikistan": "Asia", "Thailand": "Asia", "Timor-Leste": "Asia",
  "Turkey": "Asia", "Turkmenistan": "Asia", "United Arab Emirates": "Asia",
  "Uzbekistan": "Asia", "Vietnam": "Asia", "Yemen": "Asia",

  // Europe
  "Albania": "Europe", "Austria": "Europe", "Belarus": "Europe", "Belgium": "Europe",
  "Bosnia and Herz.": "Europe", "Bulgaria": "Europe", "Croatia": "Europe",
  "Czechia": "Europe", "Denmark": "Europe", "Estonia": "Europe", "Finland": "Europe",
  "France": "Europe", "Germany": "Europe", "Greece": "Europe", "Hungary": "Europe",
  "Iceland": "Europe", "Ireland": "Europe", "Italy": "Europe", "Kosovo": "Europe",
  "Latvia": "Europe", "Lithuania": "Europe", "Luxembourg": "Europe",
  "Macedonia": "Europe", "Moldova": "Europe", "Montenegro": "Europe",
  "Netherlands": "Europe", "Norway": "Europe", "Poland": "Europe",
  "Portugal": "Europe", "Romania": "Europe", "Serbia": "Europe",
  "Slovakia": "Europe", "Slovenia": "Europe", "Spain": "Europe", "Sweden": "Europe",
  "Switzerland": "Europe", "Ukraine": "Europe", "United Kingdom": "Europe",

  // North America
  "Bahamas": "North America", "Belize": "North America", "Canada": "North America",
  "Costa Rica": "North America", "Cuba": "North America",
  "Dominican Rep.": "North America", "El Salvador": "North America",
  "Greenland": "North America", "Guatemala": "North America",
  "Haiti": "North America", "Honduras": "North America", "Jamaica": "North America",
  "Mexico": "North America", "Nicaragua": "North America", "Panama": "North America",
  "Puerto Rico": "North America", "Trinidad and Tobago": "North America",
  "United States of America": "North America",

  // South America
  "Argentina": "South America", "Bolivia": "South America", "Brazil": "South America",
  "Chile": "South America", "Colombia": "South America", "Ecuador": "South America",
  "Falkland Is.": "South America", "Guyana": "South America",
  "Paraguay": "South America", "Peru": "South America", "Suriname": "South America",
  "Uruguay": "South America", "Venezuela": "South America",

  // Oceania
  "Australia": "Oceania", "Fiji": "Oceania", "New Caledonia": "Oceania",
  "New Zealand": "Oceania", "Papua New Guinea": "Oceania",
  "Solomon Is.": "Oceania", "Vanuatu": "Oceania",
};

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

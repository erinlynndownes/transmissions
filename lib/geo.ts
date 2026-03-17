export const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", MX: "Mexico",
  UK: "United Kingdom", FR: "France", DE: "Germany", ES: "Spain", IT: "Italy",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland",
  PL: "Poland", PT: "Portugal", IE: "Ireland", CH: "Switzerland", AT: "Austria",
  BE: "Belgium", CZ: "Czech Republic", RO: "Romania", GR: "Greece",
  BR: "Brazil", AR: "Argentina", CO: "Colombia", CL: "Chile",
  JP: "Japan", CN: "China", KR: "South Korea", IN: "India", TW: "Taiwan",
  AU: "Australia", NZ: "New Zealand",
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", EG: "Egypt", GH: "Ghana",
  IL: "Israel", TR: "Turkey", SA: "Saudi Arabia", AE: "United Arab Emirates",
  RU: "Russia", UA: "Ukraine", PH: "Philippines", ID: "Indonesia",
  TH: "Thailand", VN: "Vietnam", MY: "Malaysia", SG: "Singapore",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

export const CONTINENTS = [
  "Africa", "Asia", "Europe", "North America",
  "Oceania", "South America",
] as const;

// Map country names (from world-atlas 110m topojson) to continent names
export const NAME_TO_CONTINENT: Record<string, string> = {
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

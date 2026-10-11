/**
 * City names, aliases, regions and coordinates. Focused on India, with the
 * largest international hubs so foreign listings still normalise.
 */

export interface City {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lng: number;
  aliases?: string[];
}

export const CITIES: City[] = [
  { name: "Bengaluru", state: "Karnataka", country: "India", lat: 12.9716, lng: 77.5946, aliases: ["bangalore", "blr", "bengaluru urban"] },
  { name: "Mumbai", state: "Maharashtra", country: "India", lat: 19.076, lng: 72.8777, aliases: ["bombay", "navi mumbai", "thane"] },
  { name: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lng: 73.8567, aliases: ["poona", "pimpri-chinchwad", "pimpri chinchwad", "hinjewadi", "kharadi"] },
  { name: "Hyderabad", state: "Telangana", country: "India", lat: 17.385, lng: 78.4867, aliases: ["secunderabad", "hitec city", "gachibowli"] },
  { name: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lng: 80.2707, aliases: ["madras"] },
  { name: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lng: 88.3639, aliases: ["calcutta"] },
  { name: "Delhi", state: "Delhi", country: "India", lat: 28.6139, lng: 77.209, aliases: ["new delhi", "delhi ncr"] },
  { name: "Gurugram", state: "Haryana", country: "India", lat: 28.4595, lng: 77.0266, aliases: ["gurgaon"] },
  { name: "Noida", state: "Uttar Pradesh", country: "India", lat: 28.5355, lng: 77.391, aliases: ["greater noida"] },
  { name: "Ghaziabad", state: "Uttar Pradesh", country: "India", lat: 28.6692, lng: 77.4538 },
  { name: "Faridabad", state: "Haryana", country: "India", lat: 28.4089, lng: 77.3178 },
  { name: "Ahmedabad", state: "Gujarat", country: "India", lat: 23.0225, lng: 72.5714, aliases: ["amdavad"] },
  { name: "Gandhinagar", state: "Gujarat", country: "India", lat: 23.2156, lng: 72.6369 },
  { name: "Vadodara", state: "Gujarat", country: "India", lat: 22.3072, lng: 73.1812, aliases: ["baroda"] },
  { name: "Surat", state: "Gujarat", country: "India", lat: 21.1702, lng: 72.8311 },
  { name: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lng: 75.7873 },
  { name: "Indore", state: "Madhya Pradesh", country: "India", lat: 22.7196, lng: 75.8577 },
  { name: "Bhopal", state: "Madhya Pradesh", country: "India", lat: 23.2599, lng: 77.4126 },
  { name: "Nagpur", state: "Maharashtra", country: "India", lat: 21.1458, lng: 79.0882 },
  { name: "Nashik", state: "Maharashtra", country: "India", lat: 19.9975, lng: 73.7898 },
  { name: "Kochi", state: "Kerala", country: "India", lat: 9.9312, lng: 76.2673, aliases: ["cochin", "ernakulam"] },
  { name: "Thiruvananthapuram", state: "Kerala", country: "India", lat: 8.5241, lng: 76.9366, aliases: ["trivandrum"] },
  { name: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 11.0168, lng: 76.9558 },
  { name: "Mysuru", state: "Karnataka", country: "India", lat: 12.2958, lng: 76.6394, aliases: ["mysore"] },
  { name: "Mangaluru", state: "Karnataka", country: "India", lat: 12.9141, lng: 74.856, aliases: ["mangalore"] },
  { name: "Visakhapatnam", state: "Andhra Pradesh", country: "India", lat: 17.6868, lng: 83.2185, aliases: ["vizag"] },
  { name: "Vijayawada", state: "Andhra Pradesh", country: "India", lat: 16.5062, lng: 80.648 },
  { name: "Bhubaneswar", state: "Odisha", country: "India", lat: 20.2961, lng: 85.8245 },
  { name: "Chandigarh", state: "Chandigarh", country: "India", lat: 30.7333, lng: 76.7794, aliases: ["mohali", "panchkula", "tricity"] },
  { name: "Lucknow", state: "Uttar Pradesh", country: "India", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur", state: "Uttar Pradesh", country: "India", lat: 26.4499, lng: 80.3319 },
  { name: "Patna", state: "Bihar", country: "India", lat: 25.5941, lng: 85.1376 },
  { name: "Goa", state: "Goa", country: "India", lat: 15.2993, lng: 74.124, aliases: ["panaji", "panjim"] },
  { name: "Dehradun", state: "Uttarakhand", country: "India", lat: 30.3165, lng: 78.0322 },
  { name: "Guwahati", state: "Assam", country: "India", lat: 26.1445, lng: 91.7362 },
  { name: "Madurai", state: "Tamil Nadu", country: "India", lat: 9.9252, lng: 78.1198 },
  { name: "Aurangabad", state: "Maharashtra", country: "India", lat: 19.8762, lng: 75.3433, aliases: ["chhatrapati sambhajinagar"] },
  { name: "Rajkot", state: "Gujarat", country: "India", lat: 22.3039, lng: 70.8022 },
  // International hubs
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708 },
  { name: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.006, aliases: ["nyc", "new york city"] },
  { name: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194, aliases: ["sf", "bay area"] },
  { name: "Seattle", country: "United States", lat: 47.6062, lng: -122.3321 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
];

/** Regions that cover several cities. */
export const REGIONS: Record<string, string[]> = {
  "Delhi NCR": ["Delhi", "Noida", "Gurugram", "Ghaziabad", "Faridabad"],
  "Mumbai Metropolitan Region": ["Mumbai"],
};

export const ANYWHERE_IN_INDIA = "Anywhere in India";

const COUNTRY_ALIASES: Record<string, string> = {
  india: "India",
  in: "India",
  ind: "India",
  "united states": "United States",
  usa: "United States",
  us: "United States",
  "united kingdom": "United Kingdom",
  uk: "United Kingdom",
  singapore: "Singapore",
  germany: "Germany",
  canada: "Canada",
  australia: "Australia",
  netherlands: "Netherlands",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
};

const INDIAN_STATES = [
  "karnataka", "maharashtra", "telangana", "tamil nadu", "west bengal", "haryana", "uttar pradesh",
  "gujarat", "rajasthan", "madhya pradesh", "kerala", "andhra pradesh", "odisha", "punjab", "bihar",
  "goa", "uttarakhand", "assam", "delhi",
];

const lookup = new Map<string, City>();
for (const city of CITIES) {
  lookup.set(city.name.toLowerCase(), city);
  for (const alias of city.aliases ?? []) lookup.set(alias, city);
}

function clean(s: string): string {
  return s.toLowerCase().replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

/** "Bangalore" -> "Bengaluru"; unknown names are title-cased and returned as is. */
export function normalizeCity(name: string): string | null {
  const key = clean(name);
  if (!key) return null;
  const hit = lookup.get(key);
  if (hit) return hit.name;
  return null;
}

export function findCity(name: string): City | undefined {
  const n = normalizeCity(name);
  return n ? lookup.get(n.toLowerCase()) : undefined;
}

export function normalizeCountry(name: string): string | null {
  return COUNTRY_ALIASES[clean(name)] ?? null;
}

/** Expand a user's chosen location into concrete city names. */
export function expandLocation(location: string): string[] {
  const region = Object.keys(REGIONS).find((r) => r.toLowerCase() === clean(location));
  if (region) return REGIONS[region];
  const city = normalizeCity(location);
  if (city === "Delhi" && clean(location).includes("ncr")) return REGIONS["Delhi NCR"];
  return city ? [city] : [location.trim()];
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cities within radiusKm of the given city (including itself). */
export function citiesWithin(cityName: string, radiusKm: number): string[] {
  const center = findCity(cityName);
  if (!center) return [cityName];
  return CITIES.filter((c) => distanceKm(center, c) <= radiusKm).map((c) => c.name);
}

/** Search the city list for the location picker. */
export function searchCities(term: string, limit = 8): string[] {
  const q = clean(term);
  if (!q) return [];
  const results: string[] = [];
  for (const region of Object.keys(REGIONS)) {
    if (region.toLowerCase().includes(q)) results.push(region);
  }
  for (const city of CITIES) {
    const names = [city.name.toLowerCase(), ...(city.aliases ?? [])];
    if (names.some((n) => n.startsWith(q) || n.includes(q))) results.push(city.name);
  }
  return Array.from(new Set(results)).slice(0, limit);
}

export interface ParsedLocation {
  cities: string[];
  country: string | null;
  mentionsRemote: boolean;
  mentionsHybrid: boolean;
}

/**
 * Parse free-text listing locations such as "Bangalore, Karnataka, India",
 * "Pune / Mumbai", "Remote - India" or "Hybrid - Gurgaon".
 */
export function parseLocation(raw: string | null | undefined): ParsedLocation {
  const out: ParsedLocation = { cities: [], country: null, mentionsRemote: false, mentionsHybrid: false };
  if (!raw) return out;
  const text = clean(raw);
  out.mentionsRemote = /\b(remote|work from home|wfh|anywhere)\b/.test(text);
  out.mentionsHybrid = /\bhybrid\b/.test(text);

  const parts = text
    .split(/[,/|;•·\-–]|\band\b|\bor\b/)
    .map((p) => p.replace(/\b(remote|hybrid|on-?site|office|work from home|wfh)\b/g, "").trim())
    .filter(Boolean);

  const cities: string[] = [];
  for (const part of parts) {
    const region = Object.keys(REGIONS).find((r) => r.toLowerCase() === part);
    if (region) {
      cities.push(...REGIONS[region]);
      continue;
    }
    if (part === "ncr" || part === "delhi ncr") {
      cities.push(...REGIONS["Delhi NCR"]);
      continue;
    }
    const city = normalizeCity(part);
    if (city) {
      cities.push(city);
      continue;
    }
    const country = normalizeCountry(part);
    if (country) {
      out.country = country;
      continue;
    }
    if (INDIAN_STATES.includes(part)) out.country = out.country ?? "India";
  }
  out.cities = Array.from(new Set(cities));
  if (!out.country && out.cities.length) {
    out.country = findCity(out.cities[0])?.country ?? null;
  }
  return out;
}

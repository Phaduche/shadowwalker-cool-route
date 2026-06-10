// Fetches real OSM data for shade analysis and support places.
// This service is ONLY for scoring and map decoration — NOT for route geometry.
// Route geometry comes from routingService.js.

import {
  classifyPlace,
  getPlaceDescription,
  getPlaceName,
} from "../utils/placeClassifier";

// Two Overpass mirrors for resilience
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function buildOverpassQuery(bbox) {
  const { south, west, north, east } = bbox;

  // Shade data: trees, parks, covered paths, forests, tree rows
  // Support data: water, cafes, pharmacies, convenience, transit
  // We do NOT fetch highway=footway for routing — that's handled by Valhalla/OSRM
  return `
[out:json][timeout:20];
(
  node["natural"="tree"](${south},${west},${north},${east});
  way["natural"="tree_row"](${south},${west},${north},${east});
  way["natural"="wood"](${south},${west},${north},${east});
  way["landuse"="forest"](${south},${west},${north},${east});
  way["leisure"="park"](${south},${west},${north},${east});
  node["leisure"="park"](${south},${west},${north},${east});
  way["covered"="yes"]["highway"](${south},${west},${north},${east});
  way["tunnel"="yes"]["highway"="pedestrian"](${south},${west},${north},${east});
  way["natural"="tree_row"](${south},${west},${north},${east});

  node["amenity"="drinking_water"](${south},${west},${north},${east});
  node["amenity"="shelter"](${south},${west},${north},${east});
  node["shop"="convenience"](${south},${west},${north},${east});
  node["shop"="supermarket"](${south},${west},${north},${east});
  node["amenity"="cafe"](${south},${west},${north},${east});
  node["amenity"="pharmacy"](${south},${west},${north},${east});
  node["amenity"="bank"](${south},${west},${north},${east});
  node["amenity"="library"](${south},${west},${north},${east});
  node["amenity"="community_centre"](${south},${west},${north},${east});
  node["railway"="subway_entrance"](${south},${west},${north},${east});
  node["railway"="station"](${south},${west},${north},${east});
  node["public_transport"="stop_position"](${south},${west},${north},${east});
);
out center 120;
  `.trim();
}

function getElementPosition(element) {
  if (element.lat && element.lon) return [element.lat, element.lon];
  if (element.center) return [element.center.lat, element.center.lon];
  return null;
}

function convertElementToPlace(element, areaId) {
  const tags = element.tags || {};
  const type = classifyPlace(tags);
  const position = getElementPosition(element);

  if (!position || type === "other") return null;

  return {
    id: `osm-${element.type}-${element.id}`,
    areaId,
    name: getPlaceName(tags),
    type,
    position,
    description: getPlaceDescription(type),
    source: "OpenStreetMap",
  };
}

async function tryFetch(endpoint, query) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchCoolingPlaces(area) {
  const query = buildOverpassQuery(area.bbox);
  let lastErr;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await tryFetch(endpoint, query);
      return data.elements
        .map((el) => convertElementToPlace(el, area.id))
        .filter(Boolean)
        .sort((a, b) => {
          const w = {
            shade_path: 0,
            shade_area: 1,
            support_water: 2,
            support_shelter: 3,
            support_cooling: 4,
            support_transit: 5,
          };
          return (w[a.type] ?? 9) - (w[b.type] ?? 9);
        });
    } catch (err) {
      lastErr = err;
    }
  }

  // Return empty array — no fake data, caller handles "no results"
  console.warn("Overpass fetch failed:", lastErr?.message);
  return [];
}

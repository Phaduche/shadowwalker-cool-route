// I only use Overpass for shade data and nearby support places.
// The actual walking route is still handled by routingService.js,
// so trees or parks should never directly become the route line.

import {
  classifyPlace,
  getPlaceDescription,
  getPlaceName,
} from "../utils/placeClassifier";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function buildOverpassQuery(bbox) {
  const { south, west, north, east } = bbox;

  return `
[out:json][timeout:20];
(
  nwr["natural"="tree"](${south},${west},${north},${east});
  nwr["natural"="tree_row"](${south},${west},${north},${east});
  nwr["natural"="wood"](${south},${west},${north},${east});
  nwr["natural"="scrub"](${south},${west},${north},${east});
  nwr["landuse"="forest"](${south},${west},${north},${east});
  nwr["landuse"="grass"](${south},${west},${north},${east});
  nwr["landuse"="meadow"](${south},${west},${north},${east});
  nwr["leisure"="park"](${south},${west},${north},${east});
  nwr["leisure"="garden"](${south},${west},${north},${east});
  nwr["tree_lined"](${south},${west},${north},${east});
  nwr["covered"]["highway"](${south},${west},${north},${east});

  nwr["amenity"="drinking_water"](${south},${west},${north},${east});
  nwr["amenity"="shelter"](${south},${west},${north},${east});
  nwr["shop"="convenience"](${south},${west},${north},${east});
  nwr["shop"="supermarket"](${south},${west},${north},${east});
  nwr["amenity"="cafe"](${south},${west},${north},${east});
  nwr["amenity"="pharmacy"](${south},${west},${north},${east});
  nwr["amenity"="bank"](${south},${west},${north},${east});
  nwr["amenity"="library"](${south},${west},${north},${east});
  nwr["amenity"="community_centre"](${south},${west},${north},${east});
  nwr["railway"="subway_entrance"](${south},${west},${north},${east});
  nwr["railway"="station"](${south},${west},${north},${east});
  nwr["public_transport"="station"](${south},${west},${north},${east});
  nwr["public_transport"="stop_position"](${south},${west},${north},${east});
);
out center geom 220;
  `.trim();
}

function getElementPosition(element) {
  if (element.lat && element.lon) return [element.lat, element.lon];
  if (element.center) return [element.center.lat, element.center.lon];

  if (element.geometry && element.geometry.length > 0) {
    const middle = element.geometry[Math.floor(element.geometry.length / 2)];
    return [middle.lat, middle.lon];
  }

  if (element.members) {
    for (const member of element.members) {
      if (member.geometry && member.geometry.length > 0) {
        const middle = member.geometry[Math.floor(member.geometry.length / 2)];
        return [middle.lat, middle.lon];
      }
    }
  }

  return null;
}

function collectRawGeometry(element) {
  const points = [];

  if (element.geometry && element.geometry.length > 0) {
    points.push(...element.geometry);
  }

  // Some OSM parks/green areas are relations.
  // In that case, Overpass gives geometry inside relation members.
  if (element.members) {
    for (const member of element.members) {
      if (member.geometry && member.geometry.length > 0) {
        points.push(...member.geometry);
      }
    }
  }

  return points;
}

function getElementGeometry(element) {
  const rawPoints = collectRawGeometry(element);

  if (rawPoints.length === 0) {
    return [];
  }

  const step = Math.max(1, Math.floor(rawPoints.length / 35));
  const sampled = [];

  for (let i = 0; i < rawPoints.length; i += step) {
    sampled.push([rawPoints[i].lat, rawPoints[i].lon]);
  }

  return sampled;
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
    geometry: getElementGeometry(element),
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

  console.warn("Overpass fetch failed:", lastErr?.message);
  return [];
}

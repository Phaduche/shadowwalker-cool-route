import {
  classifyPlace,
  getPlaceDescription,
  getPlaceName,
} from "../utils/placeClassifier";

function buildOverpassQuery(bbox) {
  const { south, west, north, east } = bbox;

  // For the first prototype, we are not searching every possible place.
  // We picked places that are most useful for walking during extreme heat:
  // water, indoor cooling, transit access, and parks.
  return `
    [out:json][timeout:15];
    (
      nwr["shop"="convenience"](${south},${west},${north},${east});
      nwr["shop"="supermarket"](${south},${west},${north},${east});
      nwr["shop"="mall"](${south},${west},${north},${east});
      nwr["amenity"="cafe"](${south},${west},${north},${east});
      nwr["amenity"="bank"](${south},${west},${north},${east});
      nwr["amenity"="library"](${south},${west},${north},${east});
      nwr["amenity"="community_centre"](${south},${west},${north},${east});
      nwr["amenity"="pharmacy"](${south},${west},${north},${east});
      nwr["amenity"="drinking_water"](${south},${west},${north},${east});
      nwr["railway"="subway_entrance"](${south},${west},${north},${east});
      nwr["railway"="station"](${south},${west},${north},${east});
      nwr["public_transport"="station"](${south},${west},${north},${east});
      nwr["leisure"="park"](${south},${west},${north},${east});
    );
    out center 40;
  `;
}

function getElementPosition(element) {
  // OSM nodes have lat/lon directly.
  // Ways and relations usually need center coordinates from the Overpass result.
  if (element.lat && element.lon) {
    return [element.lat, element.lon];
  }

  if (element.center && element.center.lat && element.center.lon) {
    return [element.center.lat, element.center.lon];
  }

  return null;
}

function convertElementToPlace(element, areaId) {
  const tags = element.tags || {};
  const type = classifyPlace(tags);
  const position = getElementPosition(element);

  // If a place has no usable position or does not match our heat categories,
  // we skip it so the map does not get too crowded.
  if (!position || type === "other") {
    return null;
  }

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

export async function fetchCoolingPlaces(area) {
  const query = buildOverpassQuery(area.bbox);

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });

  if (!response.ok) {
    throw new Error("Overpass API request failed");
  }

  const data = await response.json();

  // We limit the number of markers because too many pins make the demo hard to read.
  return data.elements
    .map((element) => convertElementToPlace(element, area.id))
    .filter(Boolean)
    .slice(0, 30);
}

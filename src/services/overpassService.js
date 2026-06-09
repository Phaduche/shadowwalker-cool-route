import {
  classifyPlace,
  getPlaceDescription,
  getPlaceName,
} from "../utils/placeClassifier";

function buildOverpassQuery(bbox) {
  const { south, west, north, east } = bbox;

  // We search shade-related map data first.
  // Support places are still loaded, but they are not the main route target.
  return `
    [out:json][timeout:15];
    (
      nwr["natural"="tree_row"](${south},${west},${north},${east});
      nwr["natural"="tree"](${south},${west},${north},${east});
      nwr["natural"="wood"](${south},${west},${north},${east});
      nwr["landuse"="forest"](${south},${west},${north},${east});
      nwr["leisure"="park"](${south},${west},${north},${east});
      nwr["tree_lined"="yes"](${south},${west},${north},${east});
      nwr["covered"="yes"](${south},${west},${north},${east});
      nwr["covered"="arcade"](${south},${west},${north},${east});
      nwr["covered"="colonnade"](${south},${west},${north},${east});

      nwr["amenity"="shelter"](${south},${west},${north},${east});
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
    );
    out center 60;
  `;
}

function getElementPosition(element) {
  // Nodes already have lat/lon. Ways and relations use center from Overpass.
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

function sortShadeFirst(placeA, placeB) {
  const shadeWeight = {
    shade_path: 0,
    shade_area: 1,
    support_shelter: 2,
    support_water: 3,
    support_cooling: 4,
    support_transit: 5,
  };

  return (shadeWeight[placeA.type] ?? 10) - (shadeWeight[placeB.type] ?? 10);
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

  return data.elements
    .map((element) => convertElementToPlace(element, area.id))
    .filter(Boolean)
    .sort(sortShadeFirst)
    .slice(0, 60);
}

const DEFAULT_ROUTING_BASE_URL =
  "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

function getRoutingBaseUrl() {
  return import.meta.env.VITE_ROUTING_API_BASE || DEFAULT_ROUTING_BASE_URL;
}

function toCoordinateParam(point) {
  return `${point[1]},${point[0]}`;
}

function toLatLng(point) {
  return [point[1], point[0]];
}

function convertRoute(route, index) {
  const coordinates = route.geometry?.coordinates || [];
  const points = coordinates.map(toLatLng);

  if (points.length < 2) {
    return null;
  }

  return {
    id: `walking-candidate-${index}`,
    points,
    distance: Math.round(route.distance || 0),
    duration: Math.round(route.duration || 0),
    source: "walking-route-service",
  };
}

export async function fetchWalkingRouteCandidates(area) {
  const start = toCoordinateParam(area.start.position);
  const end = toCoordinateParam(area.end.position);
  const url = new URL(`${getRoutingBaseUrl()}/${start};${end}`);

  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");
  url.searchParams.set("alternatives", "true");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Walking route request failed.");
  }

  const data = await response.json();

  if (data.code && data.code !== "Ok") {
    throw new Error(data.message || "Walking route was not found.");
  }

  const candidates = (data.routes || [])
    .map(convertRoute)
    .filter(Boolean)
    .filter((route) => route.points.length > 2);

  if (candidates.length === 0) {
    throw new Error("Walking route geometry was empty.");
  }

  return candidates;
}

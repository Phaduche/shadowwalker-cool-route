// Converts raw routing-engine results + OSM data into the route/place objects
// that CoolRouteMap and RouteInfoCard expect.
//
// Key principle:
//   route GEOMETRY comes entirely from the routing engine (Valhalla/OSRM/GraphHopper).
//   Shade places from Overpass are used ONLY to score the routes — never to build geometry.

import { isShadePlace, isSupportPlace, isWalkPath } from "./placeClassifier";
import { calcShadeScore, getDistanceToShadePlace } from "./shadeScorer";

function toRad(v) {
  return (v * Math.PI) / 180;
}

function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getRouteDistance(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversine(points[i], points[i + 1]);
  }
  return Math.round(total);
}

export function getShadePlaces(places) {
  return places.filter((p) => isShadePlace(p.type));
}

export function getSupportPlaces(places) {
  return places.filter((p) => isSupportPlace(p.type)).slice(0, 15);
}

export function getWalkPlaces(places) {
  return places.filter((p) => isWalkPath(p.type));
}

// Main route builder
// engineResult = { fastRoute: {points,distance,source}, shadeCandidate: {points,distance,source}|null, engine: name }
// osmPlaces    = array of classified OSM places (from overpassService)
export function buildRoutes(area, engineResult, osmPlaces) {
  const shadePlaces = getShadePlaces(osmPlaces);

  // Fast route
  const fastPts = engineResult.fastRoute.points;
  const fastDist = engineResult.fastRoute.distance || getRouteDistance(fastPts);
  const fastShade = calcShadeScore(fastPts, shadePlaces);

  const fastRoute = {
    id: `${area.id}-fast`,
    areaId: area.id,
    name: "Fast Route",
    type: "fast",
    points: fastPts,
    distance: fastDist,
    shadeCoverage: fastShade,
    sunExposure: 100 - fastShade,
    shadePointCount: 0,
    shadePathCount: 0,
    shadeAreaCount: 0,
    walkPathCount: getWalkPlaces(osmPlaces).length,
    engine: engineResult.engine,
  };

  // Shade route
  // Use the alternative route if available; otherwise reuse the fast route geometry
  // (shade score will still be higher if there are shade places near it)
  const shadePts = engineResult.shadeCandidate
    ? engineResult.shadeCandidate.points
    : fastPts;
  const shadeDist = engineResult.shadeCandidate
    ? engineResult.shadeCandidate.distance || getRouteDistance(shadePts)
    : fastDist;
  const shadeScore = calcShadeScore(shadePts, shadePlaces);

  // Count shade-place types near this route (within 60m)
  const NEAR = 60;
  const nearShade = shadePlaces.filter((p) =>
    shadePts.some((pt) => getDistanceToShadePlace(pt, p) <= NEAR),
  );
  const shadePathCount = nearShade.filter(
    (p) => p.type === "shade_path",
  ).length;
  const shadeAreaCount = nearShade.filter(
    (p) => p.type === "shade_area",
  ).length;

  const shadeRoute = {
    id: `${area.id}-shade`,
    areaId: area.id,
    name: "Shade Route",
    type: "shade",
    points: shadePts,
    distance: shadeDist,
    shadeCoverage: shadeScore,
    sunExposure: 100 - shadeScore,
    shadePointCount: nearShade.length,
    shadePathCount,
    shadeAreaCount,
    walkPathCount: getWalkPlaces(osmPlaces).length,
    engine: engineResult.engine,
    hasAlternate: !!engineResult.shadeCandidate,
  };

  return [fastRoute, shadeRoute];
}

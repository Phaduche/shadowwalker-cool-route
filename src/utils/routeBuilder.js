import { isShadePlace, isSupportPlace } from "./placeClassifier";

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(pointA, pointB) {
  // For now, I am using straight-line distance between map points.
  // It is not a real road navigation distance yet, but it is good enough
  // to compare the fast route and the shade route in this prototype.
  const earthRadius = 6371000;

  const lat1 = toRadians(pointA[0]);
  const lat2 = toRadians(pointB[0]);
  const latDiff = toRadians(pointB[0] - pointA[0]);
  const lngDiff = toRadians(pointB[1] - pointA[1]);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function getRouteDistance(points) {
  let total = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    total += getDistanceMeters(points[i], points[i + 1]);
  }

  return Math.round(total);
}

function sortByShadeRouteValue(places, currentPoint, endPoint) {
  return [...places].sort((placeA, placeB) => {
    const placeADistanceFromNow = getDistanceMeters(currentPoint, placeA.position);
    const placeBDistanceFromNow = getDistanceMeters(currentPoint, placeB.position);

    const placeADistanceToEnd = getDistanceMeters(placeA.position, endPoint);
    const placeBDistanceToEnd = getDistanceMeters(placeB.position, endPoint);

    // shade_path is closer to our main idea because it sounds more like
    // an actual shaded walking segment. shade_area is still useful, but it
    // can be a park or a tree area near the route instead of a walkable line.
    const placeABonus = placeA.type === "shade_path" ? -180 : 0;
    const placeBBonus = placeB.type === "shade_path" ? -180 : 0;

    const scoreA = placeADistanceFromNow * 0.65 + placeADistanceToEnd * 0.35 + placeABonus;
    const scoreB = placeBDistanceFromNow * 0.65 + placeBDistanceToEnd * 0.35 + placeBBonus;

    return scoreA - scoreB;
  });
}

function removeDuplicatePlaces(places) {
  const result = [];

  for (const place of places) {
    const alreadyAdded = result.some((item) => item.id === place.id);

    if (!alreadyAdded) {
      result.push(place);
    }
  }

  return result;
}

function pickShadeStops(area, places) {
  const shadePlaces = places.filter((place) => isShadePlace(place.type));

  if (shadePlaces.length === 0) {
    return [];
  }

  // I am only picking a few shade points because the map should stay readable.
  // If we connect every tree or park from OSM, the route line will look random
  // instead of looking like a usable walking route.
  const maxStops = 3;
  const selectedStops = [];

  let currentPoint = area.start.position;

  for (let i = 0; i < maxStops; i += 1) {
    const remainingPlaces = shadePlaces.filter((place) => {
      return !selectedStops.some((selected) => selected.id === place.id);
    });

    if (remainingPlaces.length === 0) {
      break;
    }

    const sortedPlaces = sortByShadeRouteValue(
      remainingPlaces,
      currentPoint,
      area.end.position
    );

    const nextStop = sortedPlaces[0];

    selectedStops.push(nextStop);
    currentPoint = nextStop.position;
  }

  return removeDuplicatePlaces(selectedStops);
}

function estimateShadeCoverage(routeType, shadeStops) {
  // This is an estimated shade coverage score for the demo.
  // I am not saying this is exact satellite-level shade measurement.
  // The idea is to give higher coverage when the route follows shade-related OSM data.

  if (routeType === "fast") {
    return 18;
  }

  if (shadeStops.length === 0) {
    return 22;
  }

  let coverage = 30;

  for (const stop of shadeStops) {
    if (stop.type === "shade_path") {
      coverage += 18;
    }

    if (stop.type === "shade_area") {
      coverage += 14;
    }
  }

  return Math.min(coverage, 88);
}

function countStopsByType(stops, type) {
  return stops.filter((stop) => stop.type === type).length;
}

export function getShadePlaces(places) {
  return places.filter((place) => isShadePlace(place.type));
}

export function getSupportPlaces(places) {
  // These places are useful, but they should not control the main route.
  // ShadowWalker should still feel like a shade-following navigator,
  // not a route that just jumps between cafes and stores.
  return places.filter((place) => isSupportPlace(place.type)).slice(0, 12);
}

export function buildRoutes(area, places) {
  const start = area.start.position;
  const end = area.end.position;

  const shadeStops = pickShadeStops(area, places);

  const fastPoints = [start, end];
  const shadePoints = [
    start,
    ...shadeStops.map((place) => place.position),
    end,
  ];

  const fastShadeCoverage = estimateShadeCoverage("fast", []);
  const shadeRouteCoverage = estimateShadeCoverage("shade", shadeStops);

  // Fast Route is only a baseline.
  // I kept it here so users can compare the shortest-looking path
  // with the shade-focused path.
  const fastRoute = {
    id: `${area.id}-fast`,
    areaId: area.id,
    name: "Fast Route",
    type: "fast",
    points: fastPoints,
    distance: getRouteDistance(fastPoints),
    shadeCoverage: fastShadeCoverage,
    sunExposure: 100 - fastShadeCoverage,
    shadePointCount: 0,
    shadePathCount: 0,
    shadeAreaCount: 0,
  };

  // Shade Route is the actual ShadowWalker route.
  // It uses shade_path and shade_area as route hints, while support places
  // like water, cafes, shelters, and subway entrances stay separate.
  const shadeRoute = {
    id: `${area.id}-shade`,
    areaId: area.id,
    name: "Shade Route",
    type: "shade",
    points: shadePoints,
    distance: getRouteDistance(shadePoints),
    shadeCoverage: shadeRouteCoverage,
    sunExposure: 100 - shadeRouteCoverage,
    shadePointCount: shadeStops.length,
    shadePathCount: countStopsByType(shadeStops, "shade_path"),
    shadeAreaCount: countStopsByType(shadeStops, "shade_area"),
  };

  return [fastRoute, shadeRoute];
}

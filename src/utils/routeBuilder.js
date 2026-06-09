import { isShadePlace, isSupportPlace, isWalkPath } from "./placeClassifier";

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(pointA, pointB) {
  // This is straight-line distance, not road distance.
  // For this prototype, I use it only to compare nearby route hints.
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

function getClosestWalkPathDistance(place, walkPlaces) {
  if (walkPlaces.length === 0) {
    return 0;
  }

  const distances = walkPlaces.map((walkPlace) => {
    return getDistanceMeters(place.position, walkPlace.position);
  });

  return Math.min(...distances);
}

function sortByShadeRouteValue(places, currentPoint, endPoint, walkPlaces) {
  return [...places].sort((placeA, placeB) => {
    const placeADistanceFromNow = getDistanceMeters(currentPoint, placeA.position);
    const placeBDistanceFromNow = getDistanceMeters(currentPoint, placeB.position);

    const placeADistanceToEnd = getDistanceMeters(placeA.position, endPoint);
    const placeBDistanceToEnd = getDistanceMeters(placeB.position, endPoint);

    const placeAWalkDistance = getClosestWalkPathDistance(placeA, walkPlaces);
    const placeBWalkDistance = getClosestWalkPathDistance(placeB, walkPlaces);

    // shade_path matters, but it also needs to be close to a walkable path.
    // This keeps the route from jumping to a tree or park that is not actually useful for walking.
    const placeABonus = placeA.type === "shade_path" ? -180 : 0;
    const placeBBonus = placeB.type === "shade_path" ? -180 : 0;

    const scoreA =
      placeADistanceFromNow * 0.55 +
      placeADistanceToEnd * 0.25 +
      placeAWalkDistance * 0.2 +
      placeABonus;

    const scoreB =
      placeBDistanceFromNow * 0.55 +
      placeBDistanceToEnd * 0.25 +
      placeBWalkDistance * 0.2 +
      placeBBonus;

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
  const walkPlaces = places.filter((place) => isWalkPath(place.type));

  if (shadePlaces.length === 0) {
    return [];
  }

  // I am only picking a few shade points so the route stays readable.
  // The point is not to connect every tree. The point is to suggest a walkable shade route.
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
      area.end.position,
      walkPlaces
    );

    const nextStop = sortedPlaces[0];

    selectedStops.push(nextStop);
    currentPoint = nextStop.position;
  }

  return removeDuplicatePlaces(selectedStops);
}

function estimateShadeCoverage(routeType, shadeStops, walkPlaces) {
  // This is an estimated score for the demo, not exact shade measurement.
  // I give a small boost when there is walk_path data because the shade route is more believable.

  if (routeType === "fast") {
    return 18;
  }

  if (shadeStops.length === 0) {
    return walkPlaces.length > 0 ? 26 : 22;
  }

  let coverage = walkPlaces.length > 0 ? 34 : 30;

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

export function getWalkPlaces(places) {
  return places.filter((place) => isWalkPath(place.type));
}

export function getShadePlaces(places) {
  return places.filter((place) => isShadePlace(place.type));
}

export function getSupportPlaces(places) {
  // These are still support info only.
  // The main route should not become a cafe-to-store route.
  return places.filter((place) => isSupportPlace(place.type)).slice(0, 12);
}

export function buildRoutes(area, places) {
  const start = area.start.position;
  const end = area.end.position;

  const walkPlaces = getWalkPlaces(places);
  const shadeStops = pickShadeStops(area, places);

  const fastPoints = [start, end];
  const shadePoints = [
    start,
    ...shadeStops.map((place) => place.position),
    end,
  ];

  const fastShadeCoverage = estimateShadeCoverage("fast", [], walkPlaces);
  const shadeRouteCoverage = estimateShadeCoverage("shade", shadeStops, walkPlaces);

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
    walkPathCount: walkPlaces.length,
  };

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
    walkPathCount: walkPlaces.length,
  };

  return [fastRoute, shadeRoute];
}

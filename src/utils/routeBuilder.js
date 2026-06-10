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

function getClosestRouteDistance(place, routePoints) {
  if (routePoints.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const distances = routePoints.map((point) => {
    return getDistanceMeters(place.position, point);
  });

  return Math.min(...distances);
}

function getRouteShadeInfo(routePoints, places) {
  const shadePlaces = getShadePlaces(places);
  const walkPlaces = getWalkPlaces(places);
  const closeShadePlaces = shadePlaces.filter((place) => {
    const closeDistance = getClosestRouteDistance(place, routePoints);
    const limit = place.type === "shade_path" ? 45 : 70;

    return closeDistance <= limit;
  });

  const shadePathCount = countPlacesByType(closeShadePlaces, "shade_path");
  const shadeAreaCount = countPlacesByType(closeShadePlaces, "shade_area");
  const shadePointCount = closeShadePlaces.length;

  // 여기서는 그늘 점수만 계산한다. 길 모양은 무조건 보행 라우팅 결과를 그대로 쓴다.
  const coverage =
    18 + shadePathCount * 12 + shadeAreaCount * 8 + Math.min(walkPlaces.length, 8);

  return {
    shadeCoverage: Math.min(coverage, 92),
    shadePointCount,
    shadePathCount,
    shadeAreaCount,
    walkPathCount: walkPlaces.length,
  };
}

function countPlacesByType(places, type) {
  return places.filter((place) => place.type === type).length;
}

function getRouteDistanceFromCandidate(candidate) {
  if (candidate.distance > 0) {
    return candidate.distance;
  }

  return getRouteDistance(candidate.points);
}

function makeRoute(area, type, candidate, places) {
  const shadeInfo = getRouteShadeInfo(candidate.points, places);

  return {
    id: `${area.id}-${type}`,
    areaId: area.id,
    name: type === "fast" ? "Fast Route" : "Shade Route",
    type,
    points: candidate.points,
    distance: getRouteDistanceFromCandidate(candidate),
    duration: candidate.duration,
    routingSource: candidate.source,
    ...shadeInfo,
    sunExposure: 100 - shadeInfo.shadeCoverage,
  };
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

export function buildRoutes(area, places, walkingRouteCandidates = []) {
  if (walkingRouteCandidates.length === 0) {
    return [];
  }

  const candidatesByDistance = [...walkingRouteCandidates].sort((routeA, routeB) => {
    return getRouteDistanceFromCandidate(routeA) - getRouteDistanceFromCandidate(routeB);
  });

  const candidatesByShade = [...walkingRouteCandidates].sort((routeA, routeB) => {
    const shadeA = getRouteShadeInfo(routeA.points, places).shadeCoverage;
    const shadeB = getRouteShadeInfo(routeB.points, places).shadeCoverage;

    if (shadeB !== shadeA) {
      return shadeB - shadeA;
    }

    return getRouteDistanceFromCandidate(routeA) - getRouteDistanceFromCandidate(routeB);
  });

  const fastCandidate = candidatesByDistance[0];
  const shadeCandidate = candidatesByShade[0];

  // 후보가 하나뿐이면 둘 다 같은 실제 보행 경로를 보여준다. 직선을 새로 만들지는 않는다.
  return [
    makeRoute(area, "fast", fastCandidate, places),
    makeRoute(area, "shade", shadeCandidate, places),
  ];
}

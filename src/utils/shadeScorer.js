const SHADE_RADIUS_M = 70;

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversine(pointA, pointB) {
  const [lat1, lng1] = pointA;
  const [lat2, lng2] = pointB;

  const radius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isPointInsidePolygon(point, polygon) {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];

    const intersects =
      latI > lat !== latJ > lat &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function getShadeSamplePoints(place) {
  const points = [];

  if (place.position) {
    points.push(place.position);
  }

  if (place.geometry && place.geometry.length > 0) {
    points.push(...place.geometry);
  }

  return points;
}

export function getDistanceToShadePlace(routePoint, shadePlace) {
  if (
    shadePlace.type === "shade_area" &&
    shadePlace.geometry &&
    isPointInsidePolygon(routePoint, shadePlace.geometry)
  ) {
    return 0;
  }

  const shadePoints = getShadeSamplePoints(shadePlace);

  if (shadePoints.length === 0) {
    return Infinity;
  }

  let closest = Infinity;

  for (const shadePoint of shadePoints) {
    const distance = haversine(routePoint, shadePoint);

    if (distance < closest) {
      closest = distance;
    }
  }

  return closest;
}

export function calcShadeScore(routePoints, shadePlaces) {
  if (!shadePlaces || shadePlaces.length === 0) return 5;
  if (!routePoints || routePoints.length < 2) return 5;

  const samples = [];

  for (let i = 0; i < routePoints.length - 1; i += 1) {
    const a = routePoints[i];
    const b = routePoints[i + 1];

    // I sample the route itself and the middle of each segment.
    // This makes the score less random than checking only start/end.
    samples.push(a);
    samples.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }

  samples.push(routePoints[routePoints.length - 1]);

  let shadedCount = 0;

  for (const routePoint of samples) {
    const isNearShade = shadePlaces.some((place) => {
      return getDistanceToShadePlace(routePoint, place) <= SHADE_RADIUS_M;
    });

    if (isNearShade) {
      shadedCount += 1;
    }
  }

  const raw = Math.round((shadedCount / samples.length) * 100);

  // OSM shade data is incomplete, so I keep a small floor instead of showing 0%.
  return Math.max(5, Math.min(92, raw));
}

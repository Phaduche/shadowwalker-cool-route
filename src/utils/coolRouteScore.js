function clampScore(score) {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

export function calculateCoolScore(route) {
  let score = 0;

  // Shade coverage is still the main point.
  // But the shade route should also stay close to walkable path data.
  score += route.shadeCoverage * 0.85;

  // Distance matters, but I keep it as a smaller penalty than shade.
  score -= route.distance * 0.006;

  // shade_path is more route-like, shade_area is more area-like.
  score += route.shadePathCount * 6;
  score += route.shadeAreaCount * 4;

  // If OSM gives us pedestrian path data, the route feels more realistic.
  if (route.walkPathCount > 0) {
    score += 5;
  }

  return Math.round(clampScore(score));
}

export function getRecommendedRoute(routes) {
  return routes
    .map((route) => ({
      ...route,
      coolScore: calculateCoolScore(route),
    }))
    .sort((routeA, routeB) => routeB.coolScore - routeA.coolScore)[0];
}

export function getRouteComment(route) {
  if (route.type === "shade") {
    return "This route uses shade-related map data while staying close to pedestrian path data when available.";
  }

  return "This route is the shorter baseline, but it may expose the walker to more direct sunlight.";
}

export function getRouteTypeLabel(type) {
  if (type === "shade") return "Shade Route";
  if (type === "fast") return "Fast Route";
  return "Route";
}

export function getPlaceTypeLabel(type) {
  if (type === "walk_path") return "Walk path";
  if (type === "shade_path") return "Shade path";
  if (type === "shade_area") return "Shade area";
  if (type === "support_shelter") return "Shelter";
  if (type === "support_water") return "Water";
  if (type === "support_cooling") return "Cooling";
  if (type === "support_transit") return "Transit";
  return "Place";
}

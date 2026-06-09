function clampScore(score) {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

export function calculateCoolScore(route) {
  let score = 0;

  // Shade coverage is the most important part of this project.
  // The app is not trying to beat Google Maps on speed.
  // It is trying to show a safer walking option during extreme heat.
  score += route.shadeCoverage * 0.9;

  // Distance still matters because no one wants a route that is way too long.
  // I kept this penalty smaller than shade coverage because shade is the main goal.
  score -= route.distance * 0.006;

  // shade_path gets a little more weight because it is closer to a walkable shaded segment.
  // shade_area is also useful, but it may be a broader park or tree area.
  score += route.shadePathCount * 6;
  score += route.shadeAreaCount * 4;

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
    return "This route tries to follow shaded streets, parks, tree-lined paths, or covered segments when map data is available.";
  }

  return "This route is the shorter baseline, but it may expose the walker to more direct sunlight.";
}

export function getRouteTypeLabel(type) {
  if (type === "shade") return "Shade Route";
  if (type === "fast") return "Fast Route";
  return "Route";
}

export function getPlaceTypeLabel(type) {
  if (type === "shade_path") return "Shade path";
  if (type === "shade_area") return "Shade area";
  if (type === "support_shelter") return "Shelter";
  if (type === "support_water") return "Water";
  if (type === "support_cooling") return "Cooling";
  if (type === "support_transit") return "Transit";
  return "Place";
}

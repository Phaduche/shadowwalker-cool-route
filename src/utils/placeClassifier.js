export function classifyPlace(tags = {}) {
  // ShadowWalker should not connect random shade points.
  // First, we separate walkable paths from shade data so the route can stay close to sidewalks or pedestrian paths.

  if (
    tags.covered === "yes" ||
    tags.covered === "arcade" ||
    tags.covered === "colonnade" ||
    (tags.tree_lined && tags.tree_lined !== "no") ||
    tags.natural === "tree_row"
  ) {
    return "shade_path";
  }

  if (
    tags.highway === "footway" ||
    tags.highway === "pedestrian" ||
    tags.highway === "path" ||
    tags.footway === "sidewalk" ||
    tags.sidewalk === "yes" ||
    tags.sidewalk === "both" ||
    tags.sidewalk === "left" ||
    tags.sidewalk === "right"
  ) {
    return "walk_path";
  }

  if (
    tags.natural === "tree" ||
    tags.natural === "wood" ||
    tags.natural === "scrub" ||
    tags.leisure === "park" ||
    tags.leisure === "garden" ||
    tags.landuse === "forest" ||
    tags.landuse === "grass" ||
    tags.landuse === "meadow"
  ) {
    return "shade_area";
  }

  if (tags.amenity === "shelter") {
    return "support_shelter";
  }

  if (
    tags.shop === "convenience" ||
    tags.shop === "supermarket" ||
    tags.amenity === "drinking_water" ||
    tags.amenity === "pharmacy"
  ) {
    return "support_water";
  }

  if (
    tags.amenity === "cafe" ||
    tags.amenity === "bank" ||
    tags.amenity === "library" ||
    tags.amenity === "community_centre" ||
    tags.shop === "mall"
  ) {
    return "support_cooling";
  }

  if (
    tags.railway === "subway_entrance" ||
    tags.railway === "station" ||
    tags.public_transport === "station"
  ) {
    return "support_transit";
  }

  return "other";
}

export function isWalkPath(type) {
  return type === "walk_path";
}

export function isShadePlace(type) {
  return type === "shade_path" || type === "shade_area";
}

export function isSupportPlace(type) {
  return type.startsWith("support_");
}

export function getPlaceName(tags = {}) {
  // OSM names are not always clean, so this gives us a readable fallback label.
  return (
    tags.name ||
    tags.brand ||
    tags.operator ||
    tags.shop ||
    tags.amenity ||
    tags.highway ||
    tags.railway ||
    tags.natural ||
    tags.leisure ||
    "Unnamed place"
  );
}

export function getPlaceDescription(type) {
  if (type === "walk_path") {
    return "Pedestrian path or sidewalk data used to keep the shade route walkable.";
  }

  if (type === "shade_path") {
    return "Possible shaded walking segment such as a tree-lined or covered path.";
  }

  if (type === "shade_area") {
    return "Possible shaded area such as a park, tree, or wooded space.";
  }

  if (type === "support_shelter") {
    return "Nearby shelter that can be used as a support point during extreme heat.";
  }

  if (type === "support_water") {
    return "Nearby place where water may be available or purchased.";
  }

  if (type === "support_cooling") {
    return "Nearby indoor cooling place such as a cafe, bank, or library.";
  }

  if (type === "support_transit") {
    return "Nearby transit or underground access point.";
  }

  return "Nearby place from OpenStreetMap data.";
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

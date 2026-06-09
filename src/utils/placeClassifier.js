export function classifyPlace(tags = {}) {
  // Main idea: ShadowWalker should follow shade first.
  // Other places are shown as nearby support, not as the main route target.

  if (
    tags.covered === "yes" ||
    tags.covered === "arcade" ||
    tags.covered === "colonnade" ||
    tags.tree_lined === "yes" ||
    tags.natural === "tree_row"
  ) {
    return "shade_path";
  }

  if (
    tags.natural === "tree" ||
    tags.leisure === "park" ||
    tags.landuse === "forest" ||
    tags.natural === "wood"
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

export function isShadePlace(type) {
  return type === "shade_path" || type === "shade_area";
}

export function isSupportPlace(type) {
  return type.startsWith("support_");
}

export function getPlaceName(tags = {}) {
  // OSM data is not always named cleanly, so we fall back to the tag type.
  return (
    tags.name ||
    tags.brand ||
    tags.operator ||
    tags.shop ||
    tags.amenity ||
    tags.railway ||
    tags.natural ||
    tags.leisure ||
    "Unnamed place"
  );
}

export function getPlaceDescription(type) {
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
  if (type === "shade_path") return "Shade path";
  if (type === "shade_area") return "Shade area";
  if (type === "support_shelter") return "Shelter";
  if (type === "support_water") return "Water";
  if (type === "support_cooling") return "Cooling";
  if (type === "support_transit") return "Transit";
  return "Place";
}

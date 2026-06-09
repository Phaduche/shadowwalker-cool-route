export function classifyPlace(tags = {}) {
  // We only need a few categories for the first demo:
  // water, AC, shade, and underground access.
  // Keeping the categories small helps us test the map faster.

  if (
    tags.railway === "subway_entrance" ||
    tags.railway === "station" ||
    tags.public_transport === "station"
  ) {
    return "underground";
  }

  if (
    tags.shop === "convenience" ||
    tags.shop === "supermarket" ||
    tags.amenity === "drinking_water" ||
    tags.amenity === "pharmacy"
  ) {
    return "water";
  }

  if (
    tags.amenity === "cafe" ||
    tags.amenity === "bank" ||
    tags.amenity === "library" ||
    tags.amenity === "community_centre" ||
    tags.shop === "mall"
  ) {
    return "ac";
  }

  if (tags.leisure === "park") {
    return "shade";
  }

  return "other";
}

export function getPlaceName(tags = {}) {
  // Some OpenStreetMap places do not have a clean name.
  // We try name first, then use brand/operator/type as a backup.
  return (
    tags.name ||
    tags.brand ||
    tags.operator ||
    tags.shop ||
    tags.amenity ||
    tags.railway ||
    tags.leisure ||
    "Unnamed place"
  );
}

export function getPlaceDescription(type) {
  // These descriptions are short because they will appear inside map popups.
  if (type === "shade") {
    return "Possible shade or rest area that may reduce direct sunlight exposure.";
  }

  if (type === "underground") {
    return "Transit or underground access point that may help avoid direct sunlight.";
  }

  if (type === "ac") {
    return "Possible air-conditioned indoor place for a short cooling break.";
  }

  if (type === "water") {
    return "Possible place to buy or access water during hot weather.";
  }

  return "Nearby place from OpenStreetMap data.";
}

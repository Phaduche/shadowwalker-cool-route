/**
 * get shelter data from OSM API based on current location
 * @param {number} lat tis is 위도
 * @param {number} lng tis is 경도
 * @returns {Promise<Array>} and tis one is 실제 쉼터 목록
 */
export async function fetchRealShelters(lat, lng) {
  // search for nearby shelters (townhall, convenience store, bank, social facility) -->> within 500m radius
  const radius = 500;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="townhall"](around:${radius},${lat},${lng});
      node["shop"="convenience"](around:${radius},${lat},${lng});
      node["amenity"="bank"](around:${radius},${lat},${lng});
      node["amenity"="social_facility"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("OSM Shelter API error");
    
    const data = await response.json();
    
    // map OSM data to our format
    return data.elements.map((element) => {
      // set default names
      let defaultName = "nearby shelter";
      if (element.tags.shop === "convenience") defaultName = `${element.tags.brand || "convenience"} shelter`;
      if (element.tags.amenity === "bank") defaultName = `${element.tags.name || "designated bank"} shelter`;
      if (element.tags.amenity === "townhall") defaultName = `${element.tags.name || "resident center heat relief shelter"}`;

      return {
        id: element.id.toString(),
        name: element.tags.name || defaultName,
        lat: element.lat,
        lng: element.lon, // OSM uses 'lon'
        type: element.tags.amenity || element.tags.shop
      };
    });
  } catch (error) {
    console.error("had error bringing data:", error);
    return [];
  }
}
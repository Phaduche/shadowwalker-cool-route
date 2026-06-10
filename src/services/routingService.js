const TIMEOUT_MS = 12000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Routing timeout")), ms),
    ),
  ]);
}

// 일단 Valhalla부터 시도한다. 여기가 보행자 경로를 제일 그럴듯하게 줌.
async function fetchValhalla(start, end) {
  // 내 좌표는 [lat, lng]인데 Valhalla는 {lat, lon}으로 달라고 해서 바꿔준다.
  const body = {
    locations: [
      { lat: start[0], lon: start[1] },
      { lat: end[0], lon: end[1] },
    ],
    costing: "pedestrian",
    costing_options: {
      pedestrian: {
        use_roads: 0.1, // 차도보다는 인도/골목 위주로 가게 하려고 낮게 둠
        use_sidewalks: 1.0,
        use_living_streets: 0.8,
        walkway_factor: 0.8,
      },
    },
    alternates: 2, // 대안 경로도 받아야 그늘길 후보를 비교할 수 있음
    shape_format: "geojson",
    directions_options: { units: "meters" },
  };

  const res = await withTimeout(
    fetch("https://valhalla1.openstreetmap.de/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    TIMEOUT_MS,
  );

  if (!res.ok) throw new Error(`Valhalla HTTP ${res.status}`);
  const data = await res.json();

  const trip = data.trip;
  if (!trip || trip.status !== 0) throw new Error("Valhalla route failed");

  const primaryCoords = trip.legs[0].shape.coordinates;
  const primaryPoints = primaryCoords.map(([lng, lat]) => [lat, lng]);
  const primaryDist = Math.round(trip.summary.length);

  const routes = [
    {
      points: primaryPoints,
      distance: primaryDist,
      source: "valhalla",
    },
  ];

  for (const alt of data.alternates || []) {
    const altCoords = alt.trip.legs[0].shape.coordinates;
    const altPoints = altCoords.map(([lng, lat]) => [lat, lng]);
    routes.push({
      points: altPoints,
      distance: Math.round(alt.trip.summary.length),
      source: "valhalla-alt",
    });
  }

  return routes;
}

// Valhalla가 안 되면 OSRM도 한번 시도한다.
async function fetchOSRM(start, end) {
  // OSRM은 좌표 순서가 lng,lat라서 여기서 다시 뒤집어줘야 함.
  const coords = `${start[1]},${start[0]};${end[1]},${end[0]}`;
  const url =
    `https://router.project-osrm.org/route/v1/foot/${coords}` +
    `?overview=full&geometries=geojson&alternatives=true`;

  const res = await withTimeout(fetch(url), TIMEOUT_MS);
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = await res.json();

  if (data.code !== "Ok") throw new Error("OSRM route failed");

  return data.routes.map((r) => ({
    points: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: Math.round(r.distance),
    source: "osrm",
  }));
}

// 마지막 백업용. key가 없으면 실패할 수 있는데, 그래도 구조는 남겨둔다.
async function fetchGraphHopper(start, end) {
  const url =
    `https://graphhopper.com/api/1/route` +
    `?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}` +
    `&profile=foot&locale=en&calc_points=true&points_encoded=false` +
    `&algorithm=alternative_route&alternative_route.max_paths=2` +
    `&key=`;

  const res = await withTimeout(fetch(url), TIMEOUT_MS);
  if (!res.ok) throw new Error(`GraphHopper HTTP ${res.status}`);
  const data = await res.json();

  if (!data.paths || data.paths.length === 0)
    throw new Error("GraphHopper no routes");

  return data.paths.map((p) => ({
    points: p.points.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: Math.round(p.distance),
    source: "graphhopper",
  }));
}

export async function fetchWalkingRoutes(start, end) {
  const errors = [];

  for (const [name, fn] of [
    ["Valhalla", fetchValhalla],
    ["OSRM", fetchOSRM],
    ["GraphHopper", fetchGraphHopper],
  ]) {
    try {
      const results = await fn(start, end);
      if (!results || results.length === 0) throw new Error("Empty result");

      const fast = results[0];
      // 대안 경로 중 조금 돌아가는 길을 그늘 후보로 둔다. 그래야 너무 일자로만 안 감.
      const shade =
        results.length > 1
          ? results.slice(1).sort((a, b) => b.distance - a.distance)[0]
          : null;

      return { fastRoute: fast, shadeCandidate: shade, engine: name };
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }

  throw new Error(`All routing engines failed:\n${errors.join("\n")}`);
}

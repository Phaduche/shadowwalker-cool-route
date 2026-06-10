const SHADE_RADIUS_M = 40; // 이 정도 거리 안에 나무/공원이 있으면 그늘 영향이 있다고 봄

function toRad(v) { return (v * Math.PI) / 180; }

function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calcShadeScore(routePoints, shadePlaces) {
  if (!shadePlaces || shadePlaces.length === 0) return 8;
  if (!routePoints || routePoints.length < 2) return 8;

  // 모든 좌표를 다 보긴 빡세서, 선분 중간 지점들만 찍어서 확인한다.
  const midpoints = [];
  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i];
    const b = routePoints[i + 1];
    midpoints.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }

  let shadedCount = 0;
  for (const mid of midpoints) {
    const isShaded = shadePlaces.some(
      (p) => haversine(mid, p.position) <= SHADE_RADIUS_M
    );
    if (isShaded) shadedCount++;
  }

  const raw = Math.round((shadedCount / midpoints.length) * 100);
  // 완전 0이나 100처럼 보이면 이상해서 적당히 범위를 막아둔다.
  return Math.max(5, Math.min(92, raw));
}

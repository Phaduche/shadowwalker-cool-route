import {
  calculateCoolScore,
  getRouteComment,
  getRouteTypeLabel,
} from "../utils/coolRouteScore";

function RouteInfoCard({ route, isRecommended }) {
  const score = calculateCoolScore(route);

  return (
    <article className={isRecommended ? "route-card recommended" : "route-card"}>
      <div className="route-card-header">
        <div>
          <p className="section-kicker">{getRouteTypeLabel(route.type)}</p>
          <h3>{route.name}</h3>
        </div>

        {isRecommended && <span className="route-badge">Recommended</span>}
        {!isRecommended && route.type === "fast" && (
          <span className="route-badge baseline">Baseline</span>
        )}
      </div>

      <div className="score-row">
        <strong>{score}</strong>
        <span>Shade Score</span>
      </div>

      <p className="route-comment">{getRouteComment(route)}</p>

      <div className="route-stat-grid">
        <div className="route-stat">
          <span>Distance</span>
          <strong>{route.distance} m</strong>
        </div>

        <div className="route-stat">
          <span>Shade coverage</span>
          <strong>{route.shadeCoverage}%</strong>
        </div>

        <div className="route-stat">
          <span>Sun exposure</span>
          <strong>{route.sunExposure}%</strong>
        </div>

        <div className="route-stat">
          <span>Shade points</span>
          <strong>{route.shadePointCount}</strong>
        </div>
      </div>

      {route.type === "shade" && (
        <p className="small-note">
          This route keeps the walking-route geometry and uses shade data only for scoring.
        </p>
      )}
    </article>
  );
}

export default RouteInfoCard;

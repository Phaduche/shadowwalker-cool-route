import { getPlaceTypeLabel } from "../utils/coolRouteScore";

function SupportPlaceList({ places }) {
  return (
    <section className="support-panel">
      <div className="section-title-row">
        <div>
          <p className="section-kicker">Nearby support</p>
          <h2>Support places near the route</h2>
        </div>

        <span className="source-tag">OpenStreetMap</span>
      </div>

      <p className="support-description">
        These locations provide nearby options for water, cooling, shelter, or transit access.
      </p>

      <div className="support-list">
        {places.length === 0 && (
          <p className="empty-message">
            No nearby support places were found in this area.
          </p>
        )}

        {places.map((place) => (
          <div key={place.id} className={`support-item ${place.type}`}>
            <div>
              <strong>{place.name}</strong>
              <p>{place.description}</p>
            </div>

            <span>{getPlaceTypeLabel(place.type)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SupportPlaceList;

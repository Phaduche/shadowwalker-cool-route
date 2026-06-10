import { MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import { getPlaceTypeLabel } from "../utils/coolRouteScore";

function getMarkerColor(type) {
  if (type === "start") return "#111827";
  if (type === "end") return "#ef4444";

  if (type === "shade_path") return "#15803d";
  if (type === "shade_area") return "#22c55e";

  if (type === "support_water") return "#2563eb";
  if (type === "support_cooling") return "#0891b2";
  if (type === "support_shelter") return "#b7791f";
  if (type === "support_transit") return "#7c3aed";

  return "#64748b";
}

function makeMarkerIcon(type) {
  const color = getMarkerColor(type);

  return L.divIcon({
    className: "shadowwalker-marker",
    html: `<div style="background:${color}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function getRouteStyle(routeType) {
  if (routeType === "shade") {
    return {
      color: "#15803d",
      weight: 7,
      opacity: 0.9,
    };
  }

  return {
    color: "#ef4444",
    weight: 5,
    opacity: 0.7,
    dashArray: "10 10",
  };
}

function CoolRouteMap({ area, routes, shadePlaces, supportPlaces, routeError }) {
  const fastRoute = routes.find((route) => route.type === "fast");
  const shadeRoute = routes.find((route) => route.type === "shade");

  return (
    <section className="map-panel">
      <div className="section-title-row">
        <div>
          <p className="section-kicker">Shade map</p>
          <h2>Shade-following route</h2>
        </div>

        <span className="source-tag">Walking route</span>
      </div>

      <p className="map-description">
        The route line uses walking-route geometry. Shade and support map data are only used as nearby context.
      </p>

      {routeError && <p className="route-error">{routeError}</p>}

      <MapContainer
        key={area.id}
        center={area.center}
        zoom={15}
        className="leaflet-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={area.start.position} icon={makeMarkerIcon("start")}>
          <Popup>
            <strong>{area.start.name}</strong>
            <br />
            Start point
          </Popup>
        </Marker>

        <Marker position={area.end.position} icon={makeMarkerIcon("end")}>
          <Popup>
            <strong>{area.end.name}</strong>
            <br />
            Destination
          </Popup>
        </Marker>

        {fastRoute && (
          <Polyline
            positions={fastRoute.points}
            pathOptions={getRouteStyle("fast")}
          />
        )}

        {shadeRoute && (
          <Polyline
            positions={shadeRoute.points}
            pathOptions={getRouteStyle("shade")}
          />
        )}

        {shadePlaces.map((place) => (
          <Marker
            key={place.id}
            position={place.position}
            icon={makeMarkerIcon(place.type)}
          >
            <Popup>
              <strong>{place.name}</strong>
              <br />
              {getPlaceTypeLabel(place.type)}
              <br />
              {place.description}
            </Popup>
          </Marker>
        ))}

        {supportPlaces.map((place) => (
          <Marker
            key={place.id}
            position={place.position}
            icon={makeMarkerIcon(place.type)}
          >
            <Popup>
              <strong>{place.name}</strong>
              <br />
              {getPlaceTypeLabel(place.type)}
              <br />
              {place.description}
              <br />
              <small>Support location</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="map-legend">
        <span>Green line: Shade Route</span>
        <span>Red dashed line: Fast walking route</span>
        <span>Green markers: Shade context</span>
        <span>Support markers: Water, cooling, transit, shelter</span>
      </div>
    </section>
  );
}

export default CoolRouteMap;

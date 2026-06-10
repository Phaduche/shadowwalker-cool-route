import { useEffect, useMemo, useState } from "react";

import "./App.css";

import HeatAlert from "./components/HeatAlert";
import HeatSafetyGuide from "./components/HeatSafetyGuide";

import AreaSelector from "./components/AreaSelector";
import CoolRouteMap from "./components/CoolRouteMap";
import RouteInfoCard from "./components/RouteInfoCard";
import SupportPlaceList from "./components/SupportPlaceList";

import { demoAreas } from "./data/demoAreas";
import { fetchCoolingPlaces } from "./services/overpassService";
import { fetchWalkingRouteCandidates } from "./services/routingService";
import {
  buildRoutes,
  getShadePlaces,
  getSupportPlaces,
} from "./utils/routeBuilder";
import { getRecommendedRoute } from "./utils/coolRouteScore";

function App() {
  const [currentPage, setCurrentPage] = useState("main");
  const [routePanel, setRoutePanel] = useState("map");
  const [selectedAreaId, setSelectedAreaId] = useState(demoAreas[0].id);
  const [places, setPlaces] = useState([]);
  const [walkingRouteCandidates, setWalkingRouteCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState("Ready");
  const [routeError, setRouteError] = useState("");

  const selectedArea = demoAreas.find((area) => area.id === selectedAreaId);

  useEffect(() => {
    if (currentPage !== "route") {
      return;
    }

    let canUseResult = true;

    async function loadPlaces() {
      setIsLoading(true);
      setDataMessage("Loading walking route and map data...");
      setRouteError("");

      try {
        const [routeCandidates, osmPlaces] = await Promise.all([
          fetchWalkingRouteCandidates(selectedArea),
          fetchCoolingPlaces(selectedArea).catch(() => []),
        ]);

        if (!canUseResult) return;

        setWalkingRouteCandidates(routeCandidates);
        setPlaces(osmPlaces);
        setDataMessage(
          osmPlaces.length > 0
            ? "Walking route + OpenStreetMap context"
            : "Walking route loaded. OSM context unavailable."
        );
      } catch {
        if (!canUseResult) return;

        setWalkingRouteCandidates([]);
        setPlaces([]);
        setRouteError(
          "Walking route could not be loaded, so I am not showing a fake straight route."
        );
        setDataMessage("Walking route unavailable");
      } finally {
        if (canUseResult) {
          setIsLoading(false);
        }
      }
    }

    loadPlaces();

    return () => {
      canUseResult = false;
    };
  }, [currentPage, selectedArea]);

  const routes = useMemo(() => {
    return buildRoutes(selectedArea, places, walkingRouteCandidates);
  }, [selectedArea, places, walkingRouteCandidates]);

  const recommendedRoute = routes.length > 0 ? getRecommendedRoute(routes) : null;
  const shadePlaces = getShadePlaces(places).slice(0, 20);
  const supportPlaces = getSupportPlaces(places);

  return (
    <div className="app-shell">
      {currentPage === "main" && (
        <main className="home-page">
          <div className="home-title">
            <h1>Cool-Route</h1>
            <p>ShadowWalker heat and shade support</p>
          </div>

          <HeatAlert />

          <div className="home-actions">
            <button
              className="primary-button"
              onClick={() => {
                setCurrentPage("route");
                setRoutePanel("map");
              }}
            >
              Open Shade Route Map
            </button>

            <button
              className="secondary-button"
              onClick={() => setCurrentPage("guide")}
            >
              Heatwave Safety Guide
            </button>
          </div>
        </main>
      )}

      {currentPage === "guide" && (
        <main className="home-page">
          <HeatSafetyGuide onBack={() => setCurrentPage("main")} />
        </main>
      )}

      {currentPage === "route" && (
        <main className="route-app">
          <header className="route-app-bar">
            <button
              className="back-button"
              onClick={() => setCurrentPage("main")}
            >
              ←
            </button>

            <div>
              <h1>Shade Route</h1>
              <p>{isLoading ? "Loading..." : dataMessage}</p>
            </div>
          </header>

          <section className="route-map-area">
            <AreaSelector
              areas={demoAreas}
              selectedAreaId={selectedAreaId}
              onSelectArea={(areaId) => {
                setSelectedAreaId(areaId);
                setRoutePanel("map");
              }}
            />

            <CoolRouteMap
              area={selectedArea}
              routes={routes}
              shadePlaces={shadePlaces}
              supportPlaces={supportPlaces}
              routeError={routeError}
            />
          </section>

          <nav className="route-action-bar">
            <button
              className={routePanel === "map" ? "active" : ""}
              onClick={() => setRoutePanel("map")}
            >
              Map
            </button>

            <button
              className={routePanel === "compare" ? "active" : ""}
              onClick={() => setRoutePanel("compare")}
            >
              Compare
            </button>

            <button
              className={routePanel === "places" ? "active" : ""}
              onClick={() => setRoutePanel("places")}
            >
              Nearby
            </button>
          </nav>

          {routePanel === "compare" && (
            <section className="app-panel">
              <div className="panel-title-row">
                <div>
                  <p>Route comparison</p>
                  <h2>Fast route vs shade route</h2>
                </div>
              </div>

              <div className="compare-list">
                {routes.map((route) => (
                  <RouteInfoCard
                    key={route.id}
                    route={route}
                    isRecommended={recommendedRoute?.id === route.id}
                  />
                ))}

                {routes.length === 0 && (
                  <p className="empty-message">{routeError}</p>
                )}
              </div>
            </section>
          )}

          {routePanel === "places" && (
            <section className="app-panel">
              <SupportPlaceList places={supportPlaces} />
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;

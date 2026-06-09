import { useEffect, useMemo, useState } from "react";

import "./App.css";

import HeatAlert from "./components/HeatAlert";
import HeatSafetyGuide from "./components/HeatSafetyGuide";

import AreaSelector from "./components/AreaSelector";
import CoolRouteMap from "./components/CoolRouteMap";
import RouteInfoCard from "./components/RouteInfoCard";
import SupportPlaceList from "./components/SupportPlaceList";

import { demoAreas } from "./data/demoAreas";
import { fallbackPlaces } from "./data/fallbackPlaces";
import { fetchCoolingPlaces } from "./services/overpassService";
import {
  buildRoutes,
  getShadePlaces,
  getSupportPlaces,
} from "./utils/routeBuilder";
import { getRecommendedRoute } from "./utils/coolRouteScore";

function getFallbackPlacesForArea(areaId) {
  return fallbackPlaces.filter((place) => place.areaId === areaId);
}

function hasEnoughRouteData(places) {
  const hasWalkPath = places.some((place) => place.type === "walk_path");
  const hasShade = places.some(
    (place) => place.type === "shade_path" || place.type === "shade_area"
  );

  return hasWalkPath && hasShade;
}

function App() {
  const [currentPage, setCurrentPage] = useState("main");
  const [routePanel, setRoutePanel] = useState("map");
  const [selectedAreaId, setSelectedAreaId] = useState(demoAreas[0].id);
  const [places, setPlaces] = useState([]);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState("Ready");

  const selectedArea = demoAreas.find((area) => area.id === selectedAreaId);

  useEffect(() => {
    if (currentPage !== "route") {
      return;
    }

    let canUseResult = true;

    async function loadPlaces() {
      setIsLoading(true);
      setDataMessage("Loading map data...");

      try {
        const osmPlaces = await fetchCoolingPlaces(selectedArea);

        if (hasEnoughRouteData(osmPlaces)) {
          if (!canUseResult) return;

          setPlaces(osmPlaces);
          setIsUsingFallback(false);
          setDataMessage("OpenStreetMap data");
          return;
        }

        throw new Error("Not enough route data.");
      } catch (error) {
        if (!canUseResult) return;

        setPlaces(getFallbackPlacesForArea(selectedArea.id));
        setIsUsingFallback(true);
        setDataMessage("Demo data");
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
    return buildRoutes(selectedArea, places);
  }, [selectedArea, places]);

  const recommendedRoute = getRecommendedRoute(routes);
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
                    isRecommended={recommendedRoute.id === route.id}
                  />
                ))}
              </div>
            </section>
          )}

          {routePanel === "places" && (
            <section className="app-panel">
              <SupportPlaceList
                places={supportPlaces}
                isUsingFallback={isUsingFallback}
              />
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;

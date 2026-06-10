import { useEffect, useMemo, useState } from "react";
import "./App.css";

import HeatAlert from "./components/HeatAlert";
import HeatSafetyGuide from "./components/HeatSafetyGuide";
import WeatherCard from "./components/WeatherCard";
import useHeatAlert from "./hooks/useHeatAlert";

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

  // 💡 시연용 날씨 훅 정상 연동
  const { temp, status, triggerMockAlert } = useHeatAlert();

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
      {/* 🏠 메인 홈 페이지 구역 */}
      {currentPage === "main" && (
        <main className="home-page w-full max-w-md mx-auto text-center space-y-6 p-4">
          <div className="home-title">
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Cool-Route</h1>
            <p className="text-sm text-gray-500">ShadowWalker heat and shade support</p>
          </div>

          <HeatAlert />

          {/* 🌤️ 실시간 날씨 카드 구역 */}
          {temp && (
            <WeatherCard temp={temp} status={status} />
          )}

          {/* 🛠️ 데모 컨트롤러 (심사위원 시연용 패널) */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">🛠️ Demo Controller (Test Only)</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => triggerMockAlert(37)}
                className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Force 37°C (Danger)
              </button>
              <button
                onClick={() => triggerMockAlert(34)}
                className="py-2 px-3 bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Force 34°C (Warning)
              </button>
              <button
                onClick={() => triggerMockAlert(24)}
                className="py-2 px-3 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Force 24°C (Normal)
              </button>
            </div>
          </div>

          {/* 🔘 하단 액션 버튼 그룹 */}
          <div className="home-actions flex flex-col gap-3">
            <button
              className="primary-button w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all"
              onClick={() => {
                setCurrentPage("route");
                setRoutePanel("map");
              }}
            >
              Open Shade Route Map
            </button>

            <button
              className="secondary-button w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md transition-all"
              onClick={() => setCurrentPage("guide")}
            >
              Heatwave Safety Guide
            </button>
          </div>
        </main>
      )}

      {/* 📄 대응수칙 안내 페이지 구역 */}
      {currentPage === "guide" && (
        <main className="home-page">
          <HeatSafetyGuide onBack={() => setCurrentPage("main")} />
        </main>
      )}

      {/* 🗺️ 그늘 지도 서비스 구역 */}
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
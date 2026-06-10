import { useState } from "react";
import "./App.css";

// 훅 가져오기
import useHeatAlert from "./hooks/useHeatAlert";
import useCoolRoute from "./hooks/useCoolRoute";

// 컴포넌트 가져오기
import HomePanel from "./components/HomePanel";
import HeatSafetyGuide from "./components/HeatSafetyGuide";
import AreaSelector from "./components/AreaSelector";
import CoolRouteMap from "./components/CoolRouteMap";
import RouteInfoCard from "./components/RouteInfoCard";
import SupportPlaceList from "./components/SupportPlaceList";

import { demoAreas } from "./data/demoAreas";

function App() {
  const [currentPage, setCurrentPage] = useState("main");

  //  커스텀 훅으로 로직 깔끔하게 분리 완료!
  const { temp, status, triggerMockAlert } = useHeatAlert();
  const routeProps = useCoolRoute(currentPage);

  return (
    <div className="app-shell">
      {/* 홈 페이지 구역 */}
      {currentPage === "main" && (
        <HomePanel
          temp={temp}
          status={status}
          triggerMockAlert={triggerMockAlert}
          onOpenMap={() => {
            setCurrentPage("route");
            routeProps.setRoutePanel("map");
          }}
          onOpenGuide={() => setCurrentPage("guide")}
        />
      )}

      {/* 대응수칙 안내 페이지 구역 */}
      {currentPage === "guide" && (
        <main className="home-page">
          <HeatSafetyGuide onBack={() => setCurrentPage("main")} />
        </main>
      )}

      {/* 그늘 지도 서비스 구역 */}
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
              <p>
                {routeProps.isLoading ? "Loading..." : routeProps.dataMessage}
              </p>
            </div>
          </header>

          <section className="route-map-area">
            <AreaSelector
              areas={demoAreas}
              selectedAreaId={routeProps.selectedAreaId}
              onSelectArea={(areaId) => {
                routeProps.setSelectedAreaId(areaId);
                routeProps.setRoutePanel("map");
              }}
            />
            <CoolRouteMap
              area={routeProps.selectedArea}
              routes={routeProps.routes}
              shadePlaces={routeProps.shadePlaces}
              supportPlaces={routeProps.supportPlaces}
            />
          </section>

          <nav className="route-action-bar">
            <button
              className={routeProps.routePanel === "map" ? "active" : ""}
              onClick={() => routeProps.setRoutePanel("map")}
            >
              Map
            </button>
            <button
              className={routeProps.routePanel === "compare" ? "active" : ""}
              onClick={() => routeProps.setRoutePanel("compare")}
            >
              Compare
            </button>
            <button
              className={routeProps.routePanel === "places" ? "active" : ""}
              onClick={() => routeProps.setRoutePanel("places")}
            >
              Nearby
            </button>
          </nav>

          {routeProps.routePanel === "compare" && (
            <section className="app-panel">
              <div className="panel-title-row">
                <div>
                  <p>Route comparison</p>
                  <h2>Fast route vs shade route</h2>
                </div>
              </div>
              <div className="compare-list">
                {routeProps.routes.map((route) => (
                  <RouteInfoCard
                    key={route.id}
                    route={route}
                    isRecommended={routeProps.recommendedRoute?.id === route.id}
                  />
                ))}

                {routeProps.routes.length === 0 && (
                  <p className="empty-message">
                    {routeProps.routeError ||
                      "No walking route is available yet."}
                  </p>
                )}
              </div>
            </section>
          )}

          {routeProps.routePanel === "places" && (
            <section className="app-panel">
              <SupportPlaceList
                places={routeProps.supportPlaces}
                isUsingFallback={routeProps.isUsingFallback}
              />
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;

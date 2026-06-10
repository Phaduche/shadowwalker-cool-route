import { useState } from "react";
import "./App.css";

// hooks
import useHeatAlert from "./hooks/useHeatAlert";
import useCoolRoute from "./hooks/useCoolRoute";

// components
import HomePanel from "./components/HomePanel";
import HeatSafetyGuide from "./components/HeatSafetyGuide";
import AreaSelector from "./components/AreaSelector";
import CoolRouteMap from "./components/CoolRouteMap";
import RouteInfoCard from "./components/RouteInfoCard";
import SupportPlaceList from "./components/SupportPlaceList";

import { demoAreas } from "./data/demoAreas";

function App() {
  const [currentPage, setCurrentPage] = useState("main"); 
  
  const { temp, status, triggerMockAlert } = useHeatAlert();
  const routeProps = useCoolRoute("route");

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col text-slate-800 antialiased font-sans pb-[85px] md:pb-0">
      
      {/* nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[65px] bg-white border-t border-gray-200 flex items-center justify-around px-4 z-50 md:sticky md:top-0 md:bottom-auto md:h-[60px] md:border-t-0 md:border-b md:justify-between md:px-8 shadow-sm">
        <div 
          className="hidden md:block font-black text-lg tracking-tight text-green-600 uppercase cursor-pointer hover:opacity-80 transition-all"
          onClick={() => setCurrentPage("main")}
        >
          Shade Route
        </div>
        
        <div className="flex w-full md:w-auto gap-2 justify-around md:justify-end">
          <button 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
              currentPage === "map" ? "bg-green-50 text-green-600" : "bg-transparent text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => {
              setCurrentPage("map");
              routeProps.setRoutePanel("map");
            }}
          >
            Shade Map
          </button>
          <button 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
              currentPage === "guide" ? "bg-green-50 text-green-600" : "bg-transparent text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => setCurrentPage("guide")}
          >
            Safety Guide
          </button>
        </div>
      </nav>

      {/* main area */}
      <main className="flex-1 w-full max-w-md md:max-w-6xl mx-auto p-4 md:p-8">
        
        {/* main content */}
        {currentPage === "main" && (
          <HomePanel
            temp={temp}
            status={status}
            triggerMockAlert={triggerMockAlert}
          />
        )}

        {/* cool route map */}
{currentPage === "map" && (
  <div className="w-full h-full flex flex-col">
    <header className="mb-4">
      <h1 className="text-xl font-black text-gray-900 uppercase">Shade Route Map</h1>
      <p className="text-xs text-gray-500 font-medium">
        {routeProps.isLoading ? "Loading Map Data..." : routeProps.dataMessage || "Ready"}
      </p>
    </header>

    <section className="flex flex-col gap-3">
      <AreaSelector
        areas={demoAreas}
        selectedAreaId={routeProps.selectedAreaId}
        onSelectArea={(areaId) => {
          routeProps.setSelectedAreaId(areaId);
          routeProps.setRoutePanel("map");
        }}
      />
      
      <div className="w-full h-[350px] md:h-[500px] rounded-2xl overflow-hidden shadow-inner border border-gray-100">
        <CoolRouteMap
          area={routeProps.selectedArea}
          routes={routeProps.routes || []}       
          shadePlaces={routeProps.shadePlaces || []}
          supportPlaces={routeProps.supportPlaces || []}
        />
      </div>
    </section>

    {/* control panel */}
    <nav className="flex bg-gray-100 p-1 rounded-xl my-4 gap-1">
      <button
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
          routeProps.routePanel === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 bg-transparent"
        }`}
        onClick={() => routeProps.setRoutePanel("map")}
      >
        Map
      </button>
      <button
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
          routeProps.routePanel === "compare" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 bg-transparent"
        }`}
        onClick={() => routeProps.setRoutePanel("compare")}
      >
        Compare
      </button>
      <button
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
          routeProps.routePanel === "places" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 bg-transparent"
        }`}
        onClick={() => routeProps.setRoutePanel("places")}
      >
        Nearby
      </button>
    </nav>

    {/* comparison panel */}
    {routeProps.routePanel === "compare" && (
      <section className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Route comparison</p>
          <h2 className="text-sm font-black text-gray-900">Fast route vs shade route</h2>
        </div>
        <div className="space-y-2">
          {(routeProps.routes || []).map((route) => (
            <RouteInfoCard
              key={route.id}
              route={route}
              isRecommended={routeProps.recommendedRoute?.id === route.id}
            />
          ))}
          {(!routeProps.routes || routeProps.routes.length === 0) && (
            <p className="text-xs text-gray-400 py-4 text-center">
              {routeProps.routeError || "No walking route is available yet."}
            </p>
          )}
        </div>
      </section>
    )}

    {/* nearby shelters panel */}
    {routeProps.routePanel === "places" && (
      <section className="bg-white p-4 rounded-2xl border border-gray-100">
        <SupportPlaceList
          places={routeProps.supportPlaces || []}
          isUsingFallback={routeProps.isUsingFallback}
        />
      </section>
    )}
  </div>
)}

        {/* heat safety guide */}
        {currentPage === "guide" && (
          <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <HeatSafetyGuide onBack={() => setCurrentPage("main")} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
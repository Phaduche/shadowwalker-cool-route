import { useEffect, useMemo, useState } from "react";
import { demoAreas } from "../data/demoAreas";
import { fallbackPlaces } from "../data/fallbackPlaces";
import { fetchCoolingPlaces } from "../services/overpassService";
import { fetchWalkingRoutes } from "../services/routingService";
import { buildRoutes, getShadePlaces, getSupportPlaces } from "../utils/routeBuilder";
import { getRecommendedRoute } from "../utils/coolRouteScore";

function normalizeFallbackPlace(place) {
  const typeMap = {
    shade: "shade_area",
    water: "support_water",
    ac: "support_cooling",
    underground: "support_transit",
  };

  return {
    ...place,
    type: typeMap[place.type] || place.type,
    source: "fallback",
  };
}

function getFallbackPlacesForArea(areaId) {
  return fallbackPlaces
    .filter((place) => place.areaId === areaId)
    .map(normalizeFallbackPlace);
}

export default function useCoolRoute(currentPage) {
  const [routePanel, setRoutePanel] = useState("map");
  const [selectedAreaId, setSelectedAreaId] = useState(demoAreas[0].id);
  const [places, setPlaces] = useState([]);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState("Ready");
  const [routingResult, setRoutingResult] = useState(null);
  const [routeError, setRouteError] = useState("");

  const selectedArea = demoAreas.find((area) => area.id === selectedAreaId);

  useEffect(() => {
    if (currentPage !== "route") return;

    let canUseResult = true;

    async function loadPlaces() {
      setIsLoading(true);
      setDataMessage("Loading walking route...");
      setRouteError("");

      try {
        const osmPlaces = await fetchCoolingPlaces(selectedArea);
        const useFallback = osmPlaces.length === 0;
        const contextPlaces = useFallback
          ? getFallbackPlacesForArea(selectedArea.id)
          : osmPlaces;
        const walkingRoutes = await fetchWalkingRoutes(
          selectedArea.start.position,
          selectedArea.end.position
        );

        if (!canUseResult) return;

        setPlaces(contextPlaces);
        setRoutingResult(walkingRoutes);
        setIsUsingFallback(useFallback);
        setDataMessage(
          useFallback
            ? "Walking route + fallback data"
            : `Walking route + OpenStreetMap data`
        );
      } catch (error) {
        if (!canUseResult) return;

        setRoutingResult(null);
        setPlaces(getFallbackPlacesForArea(selectedArea.id));
        setIsUsingFallback(true);
        setRouteError(error.message);
        setDataMessage("Walking route unavailable");
      } finally {
        if (canUseResult) setIsLoading(false);
      }
    }

    loadPlaces();

    return () => {
      canUseResult = false;
    };
  }, [currentPage, selectedArea]);

  const routes = useMemo(() => {
    if (!routingResult) return [];
    return buildRoutes(selectedArea, routingResult, places);
  }, [selectedArea, routingResult, places]);

  const recommendedRoute = routes.length > 0 ? getRecommendedRoute(routes) : null;
  const shadePlaces = getShadePlaces(places).slice(0, 20);
  const supportPlaces = getSupportPlaces(places);

  return {
    routePanel,
    setRoutePanel,
    selectedAreaId,
    setSelectedAreaId,
    selectedArea,
    isLoading,
    dataMessage,
    routes,
    recommendedRoute,
    shadePlaces,
    supportPlaces,
    isUsingFallback,
    routeError
  };
}

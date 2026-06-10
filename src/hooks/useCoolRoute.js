import { useEffect, useMemo, useState } from "react";
import { demoAreas } from "../data/demoAreas";
import { fallbackPlaces } from "../data/fallbackPlaces";
import { fetchCoolingPlaces } from "../services/overpassService";
import { buildRoutes, getShadePlaces, getSupportPlaces } from "../utils/routeBuilder";
import { getRecommendedRoute } from "../utils/coolRouteScore";

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

export default function useCoolRoute(currentPage) {
  const [routePanel, setRoutePanel] = useState("map");
  const [selectedAreaId, setSelectedAreaId] = useState(demoAreas[0].id);
  const [places, setPlaces] = useState([]);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState("Ready");

  const selectedArea = demoAreas.find((area) => area.id === selectedAreaId);

  useEffect(() => {
    if (currentPage !== "route") return;

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
        if (canUseResult) setIsLoading(false);
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
    isUsingFallback
  };
}
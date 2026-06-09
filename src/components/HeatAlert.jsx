import { useHeatExposure } from "../hooks/useHeatExposure";

// TODO: use currentLat and currentLng to find nearby shelters and show them in the alert modal
export default function HeatAlert({
  currentLat = 37.4975,
  currentLng = 127.0270,
}) {
  const { seconds, isOutdoor } = useHeatExposure(currentLat, currentLng);

  // show time in prettier format (hh:mm:ss)
  const formatTime = (totalSeconds) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md m-4 border border-gray-100">
      {/* User Status Toggle */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <span className="text-xs font-bold text-gray-400">
          GPS Live Location Tracking
        </span>

        <span
          className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
            isOutdoor ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {isOutdoor ? "Outdoor Walking" : "Inside Cooling Shelter"}
        </span>
      </div>

      {/* timer display */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800">
          continuous heat exposure time
        </h2>

        <span
          className={`text-xl font-mono px-3 py-1 rounded-lg font-bold ${
            isOutdoor
              ? "bg-red-50 text-red-600 animate-pulse"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {formatTime(seconds)}
        </span>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        {isOutdoor
          ? "Currently exposed to high heat. Water intake alert triggers every 1 hour continuously."
          : "Inside an approved cooling area. Danger timer has been reset automatically."}
      </p>
    </div>
  );
}
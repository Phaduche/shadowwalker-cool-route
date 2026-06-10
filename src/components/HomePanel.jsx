import HeatAlert from "./HeatAlert";
import WeatherCard from "./WeatherCard";

export default function HomePanel({ temp, status, triggerMockAlert, onOpenMap, onOpenGuide }) {
  return (
    <main className="home-page w-full max-w-md mx-auto text-center space-y-6 p-4">
      <div className="home-title">
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Cool-Route</h1>
        <p className="text-sm text-gray-500">ShadowWalker heat and shade support</p>
      </div>

      <HeatAlert />

      {/* weather card */}
      {temp && <WeatherCard temp={temp} status={status} />}

      {/* demo controller */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 text-left">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Demo Controller (Test Only)</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => triggerMockAlert(37)}
            className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Force 37°C
          </button>
          <button
            onClick={() => triggerMockAlert(34)}
            className="py-2 px-3 bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Force 34°C
          </button>
          <button
            onClick={() => triggerMockAlert(24)}
            className="py-2 px-3 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Force 24°C
          </button>
        </div>
      </div>

      {/* buttons */}
      <div className="home-actions flex flex-col gap-3">
        <button
          className="primary-button w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all"
          onClick={onOpenMap}
        >
          Open Shade Route Map
        </button>

        <button
          className="secondary-button w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md transition-all"
          onClick={onOpenGuide}
        >
          Heatwave Safety Guide
        </button>
      </div>
    </main>
  );
}
import HeatAlert from "./HeatAlert";
import WeatherCard from "./WeatherCard";

export default function HomePanel({ temp, status, triggerMockAlert }) {
  return (
    <main className="w-full max-w-md md:max-w-4xl mx-auto text-center space-y-6">
      
      {/* prettier header :) */}
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
          Cool-Route
        </h1>
        <p className="text-xs font-semibold text-green-500 uppercase tracking-widest">
          ShadowWalker Heat & Shade Support
        </p>
      </div>

      {/* heat alert component */}
      <HeatAlert />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch"></div>

      {/* weather card area */}
      {temp && <WeatherCard temp={temp} status={status} />}

      {/* demo controller */}
      <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4 text-left">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            Demo Controller
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Test simulation for government guidelines
          </p>
        </div>
        
        {/* test buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => triggerMockAlert(38)} 
            className="py-2.5 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm border-none cursor-pointer"
          >
            Force 38°C
          </button>
          <button
            onClick={() => triggerMockAlert(35)}
            className="py-2.5 px-3 bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm border-none cursor-pointer"
          >
            Force 35°C
          </button>
          <button
            onClick={() => triggerMockAlert(24)}
            className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm border-none cursor-pointer"
          >
            Force 24°C
          </button>
        </div>
      </div>
    </main>
  );
}
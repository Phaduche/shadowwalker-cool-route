import { useState } from "react";
import HeatAlert from "./components/HeatAlert";
import HeatSafetyGuide from "./components/HeatSafetyGuide";

function App() {
  const [currentPage, setCurrentPage] = useState("main");

  return (
    <div className="p-4 bg-gray-50 min-h-screen flex flex-col items-center justify-center gap-4">
      
      {/* main */}
      {currentPage === "main" && (
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Cool-Route</h1>
          <p className="text-sm text-gray-500">ShadowWalker: Live map for Cool Route</p>
          
          {/* notofication zone */}
          <HeatAlert />

          {/* button to move to info page */}
          <button
            onClick={() => setCurrentPage("guide")}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            Click to see Heatwave Safety Guidelines
          </button>
        </div>
      )}

      {/* Heatwave Safety Guidelines page */}
      {currentPage === "guide" && (
        <div className="w-full max-w-md">
          <HeatSafetyGuide onBack={() => setCurrentPage("main")} />
        </div>
      )}

    </div>
  );
}

export default App;
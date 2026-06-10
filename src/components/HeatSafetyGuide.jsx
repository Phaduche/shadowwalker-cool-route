import React, { useState } from "react";
import { officialGuidelines } from "../data/officialGuidelines.js";

const HeatSafetyGuide = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("rules");
  const currentContent = officialGuidelines[activeTab];

  return (
    <div className="guide-container p-4 bg-white min-h-screen">
      {/* header area */}
      <header className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-4 text-gray-600 font-bold text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900 uppercase">
            Government Safety Guidelines
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Certified by KDCA (KR) and CDC (USA)
          </p>
        </div>
      </header>

      {/* tab navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`flex-1 py-3 font-bold text-sm transition-all ${
            activeTab === "rules" 
            ? "text-blue-600 border-b-2 border-blue-600" 
            : "text-gray-400"
          }`}
          onClick={() => setActiveTab("rules")}
        >
          SAFETY PROTOCOLS
        </button>
        <button
          className={`flex-1 py-3 font-bold text-sm transition-all ${
            activeTab === "emergency" 
            ? "text-red-600 border-b-2 border-red-600" 
            : "text-gray-400"
          }`}
          onClick={() => setActiveTab("emergency")}
        >
          EMERGENCY STEPS
        </button>
      </div>

      {/* content area */}
      <div className="space-y-6">
        {currentContent.map((item) => (
          <div key={item.id} className="pb-4 border-b border-gray-100 last:border-0">
            <h3 className={`text-base font-bold mb-2 ${
              activeTab === "rules" ? "text-blue-800" : "text-red-800"
            }`}>
              {item.title}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed text-left font-normal">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      {/* footer */}
      <footer className="mt-10 p-4 bg-gray-50 rounded-xl text-center">
        <p className="text-[10px] text-gray-400 leading-tight">
          This information is based on the guidelines provided by the Ministry of the Interior and Safety (South Korea), 
          the Korea Disease Control and Prevention Agency (KDCA), and the Centers for Disease Control and Prevention (CDC, USA).
        </p>
      </footer>

        <div className="mt-6 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-700">For Heat-Related Emergencies</span>
            </div>
        
            <button 
                onClick={() => window.location.href = "tel:911"}
                className="inline-block text-xs font-black bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-sm animate-pulse text-center border-none cursor-pointer hover:bg-red-700 transition-all"
            >
                Call 911
            </button>
        </div>
    </div>
  );
}

export default HeatSafetyGuide;
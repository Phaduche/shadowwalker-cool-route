import { useState } from "react";

export default function HeatSafetyGuide({ onBack }) {
  const [activeTab, setActiveTab] = useState("general");

  // Heatwave Safety Guidelines Data - the guidline is ai generated!! should change the content to government approved info later
  const guideData = {
    general: {
      title: "General Public Guidelines",
      subtitle: "3 Core Preventive Rules for Everyone",
      tips: [
        { title: "Stay Hydrated", desc: "Drink water or sports drinks regularly, even if you do not feel thirsty." },
        { title: "Keep Cool", desc: "Wear lightweight, light-colored clothing and block sunlight with umbrellas or hats when outdoors." },
        { title: "Take Breaks", desc: "Minimize outdoor activities and rest during peak heat hours (12 PM – 5 PM)." },
      ]
    },
    vulnerable: {
      title: "Vulnerable Groups",
      subtitle: "Special Care for Seniors, Children, and Chronic Patients",
      tips: [
        { title: "Daily Check-ins", desc: "Families or neighbors should check the health status of elderly individuals living alone daily." },
        { title: "Monitor Indoor Temp", desc: "Keep indoor temperatures between 26–28°C using air conditioners or fans actively." },
        { title: "Emergency Contacts", desc: "Contact emergency services immediately if early symptoms like dizziness or headaches appear." },
      ]
    },
    worker: {
      title: "Outdoor Workers",
      subtitle: "Safety Protocols for Construction and Field Works",
      tips: [
        { title: "Provide Water & Salt", desc: "Ensure clean, cool water and salt are always accessible close to the workspace." },
        { title: "Shaded Rest Areas", desc: "Set up well-ventilated, shaded resting areas protected from direct sunlight." },
        { title: "Mandatory Breaks", desc: "Provide 10 to 15 minutes of mandatory rest every hour during heatwave warnings." },
      ]
    }
  };

  const currentGuide = guideData[activeTab];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md m-4 border border-gray-100 max-w-md mx-auto">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-all"
      >
        <span>←</span> Back
      </button>

      {/* Header Section */}
      <div className="mb-6">
        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Safety Guide</span>
        <h2 className="text-xl font-extrabold text-gray-900 mt-1">Heatwave Action Protocols</h2>
        <p className="text-xs text-gray-400 mt-1">Check the guidelines based on your situation to prevent heat-related illnesses.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "general" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("vulnerable")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "vulnerable" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Vulnerable
        </button>
        <button
          onClick={() => setActiveTab("worker")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "worker" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Workers
        </button>
      </div>

      {/* Guidelines Content */}
      <div className="space-y-4 animate-fadeIn">
        <div className="border-b border-gray-50 pb-2">
          <h3 className="text-base font-bold text-gray-800">{currentGuide.title}</h3>
          <p className="text-xs text-amber-600 font-medium mt-0.5">{currentGuide.subtitle}</p>
        </div>

        {/* Action Card List */}
        {currentGuide.tips.map((tip, index) => (
          <div key={index} className="p-4 bg-amber-50/40 rounded-xl border border-amber-100/50 space-y-0.5">
            <h4 className="text-sm font-bold text-gray-800">{tip.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </div>

        <div className="mt-6 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-700">For Heat-Related Emergencies</span>
            </div>
        
            <button 
                onClick={() => window.location.href = "tel:119"}
                className="inline-block text-xs font-black bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-sm animate-pulse text-center border-none cursor-pointer hover:bg-red-700 transition-all"
            >
                Call 119
            </button>
        </div>
    </div>
  );
}
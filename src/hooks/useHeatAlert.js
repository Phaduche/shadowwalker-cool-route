import { useEffect, useState } from "react"
import { getWeather } from "../utils/weather"

export default function useHeatAlert() {
  const [temp, setTemp] = useState(null)
  const [status, setStatus] = useState("Loading...")

  const notify = (title, body) => {
    if (!("Notification" in window)) return

    if (Notification.permission === "granted") {
      new Notification(title, { body })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") {
          new Notification(title, { body })
        }
      })
    }
  }

  // official government guidelines
  const getAlertConfig = (currentTemp) => {
    if (currentTemp >= 38) {
      return {
        status: "EXTREME DANGER",
        message: `Currently ${currentTemp}°C - STOP all outdoor activities immediately. Move indoors to an air-conditioned environment. Heatstroke risk is critical.`
      }
    } else if (currentTemp >= 35) {
      return {
        status: "DANGER",
        message: `Currently ${currentTemp}°C - Limit outdoor activities. Take a 15-minute rest in the shade every 45 minutes. Hydrate immediately.`
      }
    } else if (currentTemp >= 31) {
      return {
        status: "EXTRA CAUTION",
        message: `Currently ${currentTemp}°C - Prolonged exposure can lead to heat cramps. Drink plenty of water and wear sun protection.`
      }
    } else {
      return {
        status: "Normal",
        message: `Currently ${currentTemp}°C - Have a nice day! Stay hydrated and use cool shade routes for walking.`
      }
    }
  }

  // demo button for testing
  const triggerMockAlert = (mockTemp) => {
    setTemp(mockTemp)
    const config = getAlertConfig(mockTemp)
    
    setStatus(config.status)
    notify(`[${config.status}] Heat Alert (Demo)`, config.message)
  }

  // load weather info
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude

      const data = await getWeather(lat, lon)
      const t = data.main.temp

      setTemp(t)

      const config = getAlertConfig(t)
      setStatus(config.status)

      // alarm daily
      const today = new Date().toDateString()
      const last = localStorage.getItem("lastAlert")

      if (last !== today) {
        notify(`Today's Weather Summary (${t}°C)`, `Current Condition: ${config.message}`)
        localStorage.setItem("lastAlert", today)
      }
    })
  }, [])

  return { temp, status, triggerMockAlert }
}
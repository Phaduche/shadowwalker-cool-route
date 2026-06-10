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

const triggerMockAlert = (mockTemp) => {
    setTemp(mockTemp)
    
    if (mockTemp >= 36) {
      setStatus("Very Hot")
      notify("Heat Alert [Demo]", `Currently ${mockTemp}°C - avoid going out!`)
    } else if (mockTemp >= 33) {
      setStatus("Heat Wave Warning")
      notify("Heat Wave Warning [Demo]", `Currently ${mockTemp}°C - stay hydrated!`)
    } else {
      setStatus("Normal")
      notify("Weather Updated [Demo]", `Currently ${mockTemp}°C - Have a nice day!`)
    }
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude

      const data = await getWeather(lat, lon)
      const t = data.main.temp

      setTemp(t)

      // temp status
      if (t >= 36) {
        setStatus("Very Hot")
        notify("Heat Alert", `currently ${t}°C - avoid going out`)
      } 
      else if (t >= 33) {
        setStatus("Heat Wave Warning")
        notify("Heat Wave Warning", `currently ${t}°C`)
      } 
      else {
        setStatus("Normal")
      }

      // alarm daily
      const today = new Date().toDateString()
      const last = localStorage.getItem("lastAlert")

      if (last !== today) {
        notify("Today's Weather Summary", `currently ${t}°C`)
        localStorage.setItem("lastAlert", today)
      }
    })
  }, [])

  return { temp, status, triggerMockAlert }
}
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

export async function getWeather(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  )

  return await res.json()
}

console.log(import.meta.env.VITE_OPENWEATHER_API_KEY)
console.log("API KEY:", API_KEY)
export async function getWeather(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=77a81b6ab6e61d00e6ed3f638072179d&units=metric`
  )

  return await res.json()
}
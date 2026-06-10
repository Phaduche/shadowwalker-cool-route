export default function WeatherCard({ temp, status }) {
  const color =
    temp >= 36
      ? "text-red-500"
      : temp >= 33
      ? "text-orange-400"
      : "text-green-400"

  return (
    <div className="mt-6 p-6 bg-gray-800 rounded-xl text-center">
      <p className={`text-5xl font-bold ${color}`}>{temp}°C</p>
      <p className="mt-2 text-white">{status}</p>
    </div>
  )
}
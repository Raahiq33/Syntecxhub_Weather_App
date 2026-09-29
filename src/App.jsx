import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("Colombo");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getWeather = async (searchCity = city) => {
    try {
      setLoading(true);
      setError("");

      const locationResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchCity
        )}&count=1&language=en&format=json`
      );

      if (!locationResponse.ok) {
        throw new Error("Location search failed");
      }

      const locationData = await locationResponse.json();

      if (!locationData.results?.length) {
        throw new Error("City not found");
      }

      const { latitude, longitude, name, country } =
        locationData.results[0];

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error("Weather data failed");
      }

      const weatherData = await weatherResponse.json();

      setWeather({
        ...weatherData.current,
        city: name,
        country,
      });

      setForecast(
        weatherData.daily.time.map((date, index) => ({
          date,
          max: weatherData.daily.temperature_2m_max[index],
          min: weatherData.daily.temperature_2m_min[index],
          code: weatherData.daily.weather_code[index],
        }))
      );
    } catch (err) {
      setError(err.message || "Unable to get weather data.");
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getWeather("Colombo");
  }, []);

  const getWeatherText = (code) => {
    if (code === 0) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Partly cloudy";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
    if ([71, 73, 75, 77].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Rain showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Unknown";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (city.trim()) {
      getWeather(city.trim());
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Weather App</h1>
        <p>Check current weather and forecast</p>
      </header>

      <main className="container">
        <form className="search-box" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />

          <button type="submit">Search</button>
        </form>

        {loading && <p className="message">Loading weather...</p>}

        {error && <p className="error">{error}</p>}

        {weather && !loading && (
          <>
            <section className="current-weather">
              <h2>
                {weather.city}, {weather.country}
              </h2>

              <div className="temperature">
                {Math.round(weather.temperature_2m)}°C
              </div>

              <p>{getWeatherText(weather.weather_code)}</p>

              <div className="details">
                <div>
                  <span>Feels Like</span>
                  <strong>
                    {Math.round(weather.apparent_temperature)}°C
                  </strong>
                </div>

                <div>
                  <span>Humidity</span>
                  <strong>
                    {weather.relative_humidity_2m}%
                  </strong>
                </div>

                <div>
                  <span>Wind</span>
                  <strong>
                    {weather.wind_speed_10m} km/h
                  </strong>
                </div>
              </div>
            </section>

            <section className="forecast">
              <h2>7-Day Forecast</h2>

              <div className="forecast-grid">
                {forecast.slice(0, 7).map((day) => (
                  <div className="forecast-card" key={day.date}>
                    <strong>
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </strong>

                    <p>{getWeatherText(day.code)}</p>

                    <div>
                      {Math.round(day.max)}° /{" "}
                      {Math.round(day.min)}°
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;

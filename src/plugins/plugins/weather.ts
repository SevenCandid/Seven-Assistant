/**
 * Weather Plugin - Fetch weather forecast from Open-Meteo API
 */

import { Plugin, PluginContext, PluginResult } from '../types';

interface WeatherArgs {
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface WeatherData {
  temperature: number;
  temperatureUnit: string;
  description: string;
  windSpeed: number;
  humidity: number;
  location: string;
  forecast?: any;
}

const parseWeatherArgs = (args: any): WeatherArgs => {
  if (typeof args === 'string') {
    return { location: args.trim() };
  }
  return args;
};

// Geocoding API to convert location name to coordinates
const geocodeLocation = async (location: string): Promise<{ lat: number; lon: number; name: string }> => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    throw new Error(`Location "${location}" not found. Please try a different location.`);
  }
  
  const result = data.results[0];
  return {
    lat: result.latitude,
    lon: result.longitude,
    name: `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`,
  };
};

// Fetch weather data from Open-Meteo
const fetchWeatherData = async (latitude: number, longitude: number): Promise<any> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  return data;
};

// Weather code to description mapping (WMO Weather interpretation codes)
const getWeatherDescription = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  
  return weatherCodes[code] || 'Unknown';
};

const plugin: Plugin = {
  metadata: {
    name: 'weather',
    description: 'Get current weather and forecast for any location using Open-Meteo API. Example: "what\'s the weather in Tokyo?"',
    version: '1.0.0',
    author: 'Seven AI',
    enabled: true,
  },

  async execute(args: any, context: PluginContext): Promise<PluginResult> {
    try {
      const { location, latitude, longitude } = parseWeatherArgs(args);

      let lat: number;
      let lon: number;
      let locationName: string;

      // If location name provided, geocode it
      if (location) {
        const geocoded = await geocodeLocation(location);
        lat = geocoded.lat;
        lon = geocoded.lon;
        locationName = geocoded.name;
      } 
      // If coordinates provided, use them
      else if (latitude !== undefined && longitude !== undefined) {
        lat = latitude;
        lon = longitude;
        locationName = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      } 
      // Default to a major city (New York)
      else {
        lat = 40.7128;
        lon = -74.0060;
        locationName = 'New York, NY, USA';
      }

      // Fetch weather data
      const weatherData = await fetchWeatherData(lat, lon);
      const current = weatherData.current;
      const daily = weatherData.daily;

      const weatherDescription = getWeatherDescription(current.weathercode);

      const weatherInfo: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        temperatureUnit: '°F',
        description: weatherDescription,
        windSpeed: Math.round(current.windspeed_10m),
        humidity: current.relative_humidity_2m,
        location: locationName,
        forecast: {
          today: {
            high: Math.round(daily.temperature_2m_max[0]),
            low: Math.round(daily.temperature_2m_min[0]),
            description: getWeatherDescription(daily.weathercode[0]),
          },
          tomorrow: {
            high: Math.round(daily.temperature_2m_max[1]),
            low: Math.round(daily.temperature_2m_min[1]),
            description: getWeatherDescription(daily.weathercode[1]),
          },
        },
      };

      const message = `Weather in ${locationName}:
🌡️ Temperature: ${weatherInfo.temperature}${weatherInfo.temperatureUnit}
☁️ Conditions: ${weatherInfo.description}
💨 Wind: ${weatherInfo.windSpeed} mph
💧 Humidity: ${weatherInfo.humidity}%

📅 Forecast:
Today: ${weatherInfo.forecast.today.description}, High ${weatherInfo.forecast.today.high}${weatherInfo.temperatureUnit}, Low ${weatherInfo.forecast.today.low}${weatherInfo.temperatureUnit}
Tomorrow: ${weatherInfo.forecast.tomorrow.description}, High ${weatherInfo.forecast.tomorrow.high}${weatherInfo.temperatureUnit}, Low ${weatherInfo.forecast.tomorrow.low}${weatherInfo.temperatureUnit}`;

      return {
        success: true,
        message,
        data: weatherInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get weather: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  },
};

export default plugin;









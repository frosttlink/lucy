import type { Tool, ToolParams } from './engine'

interface WeatherResponse {
  location: string
  temperature: string
  condition: string
  humidity: string
  windSpeed: string
  forecast?: DayForecast[]
}

interface DayForecast {
  date: string
  maxTemperature: string
  minTemperature: string
  condition: string
}

export class WeatherTool implements Tool {
  name() {
    return 'weather'
  }

  description() {
    return 'Get current weather and forecast for any location. Provide the city name or coordinates.'
  }

  parameters() {
    return {
      location: {
        type: 'string',
        description: "City name (e.g., 'London', 'New York', 'Tokyo') or coordinates (e.g., '51.5,-0.12')",
      },
      days: {
        type: 'number',
        description: 'Number of forecast days (1-7, default: 1)',
      },
    }
  }

  async execute(params: ToolParams): Promise<string> {
    const location = params.location as string
    if (!location?.trim()) throw new Error('location is required')

    let days = 1
    if (typeof params.days === 'number') {
      days = Math.max(1, Math.min(7, Math.round(params.days)))
    }

    const { lat, lon, name } = await this.geocode(location)

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=${days}&timezone=auto`

    const response = await fetch(weatherUrl)
    if (!response.ok) throw new Error(`weather API error: ${response.status}`)
    const data = (await response.json()) as {
      current?: {
        temperature_2m: number
        relative_humidity_2m: number
        weather_code: number
        wind_speed_10m: number
      }
      daily?: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        weather_code: number[]
      }
    }

    const result: WeatherResponse = {
      location: name,
      temperature: '',
      condition: '',
      humidity: '',
      windSpeed: '',
    }

    if (data.current) {
      result.temperature = `${data.current.temperature_2m.toFixed(1)}°C`
      result.humidity = `${data.current.relative_humidity_2m.toFixed(0)}%`
      result.windSpeed = `${data.current.wind_speed_10m.toFixed(1)} km/h`
      result.condition = this.weatherCodeToCondition(data.current.weather_code)
    }

    if (data.daily) {
      result.forecast = data.daily.time.map((date, i) => ({
        date,
        maxTemperature: `${data.daily!.temperature_2m_max[i].toFixed(1)}°C`,
        minTemperature: `${data.daily!.temperature_2m_min[i].toFixed(1)}°C`,
        condition: this.weatherCodeToCondition(data.daily!.weather_code[i]),
      }))
    }

    return JSON.stringify(result, null, 2)
  }

  private async geocode(location: string): Promise<{ lat: number; lon: number; name: string }> {
    // Check if it's coordinates
    const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
    if (coordMatch) {
      return { lat: Number.parseFloat(coordMatch[1]), lon: Number.parseFloat(coordMatch[2]), name: location }
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    const response = await fetch(geoUrl)
    if (!response.ok) throw new Error('geocoding failed')
    const data = (await response.json()) as {
      results?: Array<{ latitude: number; longitude: number; name: string; country: string }>
    }

    if (!data.results?.length) throw new Error('location not found')

    const r = data.results[0]
    return { lat: r.latitude, lon: r.longitude, name: `${r.name}, ${r.country}` }
  }

  private weatherCodeToCondition(code: number): string {
    if (code === 0) return 'Clear sky'
    if (code <= 3) return 'Mainly clear'
    if (code <= 19) return 'Foggy'
    if (code <= 29) return 'Thunderstorm'
    if (code <= 39) return 'Drizzle'
    if (code <= 49) return 'Rain'
    if (code <= 59) return 'Freezing rain'
    if (code <= 69) return 'Snow'
    if (code <= 79) return 'Snow grains'
    if (code <= 84) return 'Rain showers'
    if (code <= 86) return 'Snow showers'
    if (code >= 95) return 'Thunderstorm'
    return 'Unknown'
  }
}

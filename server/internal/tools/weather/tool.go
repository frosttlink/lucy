package weather

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/frostz/lucy/internal/tools"
)

type Tool struct{}

func New() *Tool {
	return &Tool{}
}

func (t *Tool) Name() string {
	return "weather"
}

func (t *Tool) Description() string {
	return "Get current weather and forecast for any location. Provide the city name or coordinates."
}

func (t *Tool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"location": map[string]interface{}{
			"type":        "string",
			"description": "City name (e.g., 'London', 'New York', 'Tokyo') or coordinates (e.g., '51.5,-0.12')",
		},
		"days": map[string]interface{}{
			"type":        "number",
			"description": "Number of forecast days (1-7, default: 1)",
		},
	}
}

type geocodeResult struct {
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lon"`
	Name      string  `json:"name"`
	Country   string  `json:"country"`
}

type weatherResponse struct {
	Location    string        `json:"location"`
	Temperature string        `json:"temperature"`
	Condition   string        `json:"condition"`
	Humidity    string        `json:"humidity"`
	WindSpeed   string        `json:"wind_speed"`
	Forecast    []dayForecast `json:"forecast,omitempty"`
}

type dayForecast struct {
	Date      string `json:"date"`
	MaxTemp   string `json:"max_temperature"`
	MinTemp   string `json:"min_temperature"`
	Condition string `json:"condition"`
}

func (t *Tool) Execute(ctx context.Context, params tools.Params) (string, error) {
	location, _ := params["location"].(string)
	if location == "" {
		return "", fmt.Errorf("location is required")
	}

	days := 1
	if d, ok := params["days"].(float64); ok {
		days = int(d)
		if days < 1 {
			days = 1
		}
		if days > 7 {
			days = 7
		}
	}

	lat, lon, name, err := geocode(ctx, location)
	if err != nil {
		return "", fmt.Errorf("could not find location: %w", err)
	}

	weatherURL := fmt.Sprintf(
		"https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=%d&timezone=auto",
		lat, lon, days,
	)

	req, err := http.NewRequestWithContext(ctx, "GET", weatherURL, nil)
	if err != nil {
		return "", err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("weather API error: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 100_000))
	if err != nil {
		return "", err
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(body, &raw); err != nil {
		return "", err
	}

	current, _ := raw["current"].(map[string]interface{})
	daily, _ := raw["daily"].(map[string]interface{})

	result := weatherResponse{Location: name}

	if current != nil {
		if temp, ok := current["temperature_2m"].(float64); ok {
			result.Temperature = fmt.Sprintf("%.1f°C", temp)
		}
		if humidity, ok := current["relative_humidity_2m"].(float64); ok {
			result.Humidity = fmt.Sprintf("%.0f%%", humidity)
		}
		if wind, ok := current["wind_speed_10m"].(float64); ok {
			result.WindSpeed = fmt.Sprintf("%.1f km/h", wind)
		}
		if code, ok := current["weather_code"].(float64); ok {
			result.Condition = weatherCodeToCondition(int(code))
		}
	}

	if daily != nil {
		dates, _ := daily["time"].([]interface{})
		maxTemps, _ := daily["temperature_2m_max"].([]interface{})
		minTemps, _ := daily["temperature_2m_min"].([]interface{})
		codes, _ := daily["weather_code"].([]interface{})

		for i := 0; i < len(dates) && i < days; i++ {
			f := dayForecast{
				Date: fmt.Sprintf("%v", dates[i]),
			}
			if i < len(maxTemps) {
				f.MaxTemp = fmt.Sprintf("%.1f°C", maxTemps[i].(float64))
			}
			if i < len(minTemps) {
				f.MinTemp = fmt.Sprintf("%.1f°C", minTemps[i].(float64))
			}
			if i < len(codes) {
				f.Condition = weatherCodeToCondition(int(codes[i].(float64)))
			}
			result.Forecast = append(result.Forecast, f)
		}
	}

	b, _ := json.MarshalIndent(result, "", "  ")
	return string(b), nil
}

func geocode(ctx context.Context, location string) (lat, lon float64, name string, err error) {
	_, scanErr := fmt.Sscanf(location, "%f,%f", &lat, &lon)
	if scanErr == nil {
		return lat, lon, location, nil
	}

	geoURL := fmt.Sprintf("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=1&language=en&format=json", url.QueryEscape(location))

	var req *http.Request
	req, err = http.NewRequestWithContext(ctx, "GET", geoURL, nil)
	if err != nil {
		return
	}

	var resp *http.Response
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, readErr := io.ReadAll(io.LimitReader(resp.Body, 50_000))
	if readErr != nil {
		err = readErr
		return
	}

	var geoResp struct {
		Results []geocodeResult `json:"results"`
	}
	if jsonErr := json.Unmarshal(body, &geoResp); jsonErr != nil {
		err = jsonErr
		return
	}

	if len(geoResp.Results) == 0 {
		err = fmt.Errorf("location not found")
		return
	}

	r := geoResp.Results[0]
	return r.Latitude, r.Longitude, fmt.Sprintf("%s, %s", r.Name, r.Country), nil
}

func weatherCodeToCondition(code int) string {
	switch {
	case code == 0:
		return "Clear sky"
	case code <= 3:
		return "Mainly clear"
	case code <= 19:
		return "Foggy"
	case code <= 29:
		return "Thunderstorm"
	case code <= 39:
		return "Drizzle"
	case code <= 49:
		return "Rain"
	case code <= 59:
		return "Freezing rain"
	case code <= 69:
		return "Snow"
	case code <= 79:
		return "Snow grains"
	case code <= 84:
		return "Rain showers"
	case code <= 86:
		return "Snow showers"
	case code >= 95:
		return "Thunderstorm"
	default:
		return "Unknown"
	}
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface TravelInfo {
  distance: number;
  duration: number;
}

interface WeatherInfo {
  temp: number;
  description: string;
  icon: string;
}

// 주소를 좌표로 변환
async function fetchCoordinates(address: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'booking-hub-app',
        },
      }
    );

    const data = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  } catch (err) {
    console.error('좌표 조회 실패:', err);
    return null;
  }
}

// 현재 위치에서 목적지까지 이동 시간 계산 (OSRM)
async function calculateTravelTime(
  destination: Coordinates
): Promise<TravelInfo | null> {
  try {
    // 기본값: 서울 강남역 (테스트용)
    const userLat = 37.4979;
    const userLng = 127.0276;

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destination.lng},${destination.lat}?overview=false`
    );

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMin = Math.round(route.duration / 60);

      return {
        distance: parseFloat(distanceKm),
        duration: durationMin,
      };
    }

    return null;
  } catch (err) {
    console.error('이동 시간 계산 실패:', err);
    return null;
  }
}

// 날씨 조회 (Open-Meteo)
async function fetchWeather(coords: Coordinates): Promise<WeatherInfo | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,weather_code&timezone=Asia/Seoul`
    );

    const data = await response.json();
    const current = data.current;

    const weatherDescriptions: { [key: number]: { desc: string; icon: string } } = {
      0: { desc: '맑음', icon: '☀️' },
      1: { desc: '흐림', icon: '🌤️' },
      2: { desc: '흐림', icon: '🌤️' },
      3: { desc: '흐림', icon: '☁️' },
      45: { desc: '안개', icon: '🌫️' },
      51: { desc: '이슬비', icon: '🌧️' },
      61: { desc: '비', icon: '🌧️' },
      71: { desc: '눈', icon: '❄️' },
      80: { desc: '소나기', icon: '⛈️' },
      95: { desc: '천둥번개', icon: '⛈️' },
    };

    const weatherInfo = weatherDescriptions[current.weather_code] || {
      desc: '정보 없음',
      icon: '❓',
    };

    return {
      temp: Math.round(current.temperature_2m),
      description: weatherInfo.desc,
      icon: weatherInfo.icon,
    };
  } catch (err) {
    console.error('날씨 조회 실패:', err);
    return null;
  }
}

// 주소와 함께 이동 시간과 날씨 조회
export async function getTravelAndWeather(
  address: string
): Promise<{ distance?: number; duration?: number; weather?: string } | null> {
  const coords = await fetchCoordinates(address);
  if (!coords) return null;

  const [travelInfo, weatherInfo] = await Promise.all([
    calculateTravelTime(coords),
    fetchWeather(coords),
  ]);

  const result: { distance?: number; duration?: number; weather?: string } = {};

  if (travelInfo) {
    result.distance = travelInfo.distance;
    result.duration = travelInfo.duration;
  }

  if (weatherInfo) {
    result.weather = `${weatherInfo.icon} ${weatherInfo.temp}°C ${weatherInfo.description}`;
  }

  return Object.keys(result).length > 0 ? result : null;
}

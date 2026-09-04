import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapModalProps {
  address: string;
  onClose: () => void;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface Weather {
  temp: number;
  description: string;
  icon: string;
}

interface TravelInfo {
  distance: number;
  duration: number;
}

export default function MapModal({ address, onClose }: MapModalProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTravelTime = async (from: Coordinates, to: Coordinates) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);

        setTravelInfo({
          distance: parseFloat(distanceKm),
          duration: durationMin,
        });
      }
    } catch (err) {
      console.warn('이동 시간 계산 실패:', err);
    }
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          console.log('📍 현재 위치:', loc);
        },
        (error) => {
          console.warn('현재 위치 탐색 실패:', error);
        }
      );
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    fetchCoordinates();
  }, [address]);

  useEffect(() => {
    if (userLocation && coordinates) {
      calculateTravelTime(userLocation, coordinates);
    }
  }, [userLocation, coordinates]);

  const fetchCoordinates = async () => {
    try {
      setLoading(true);
      setError(null);

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
        setError('주소를 찾을 수 없습니다');
        setLoading(false);
        return;
      }

      const { lat, lon } = data[0];
      const coords = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setCoordinates(coords);

      fetchWeather(coords);
    } catch (err) {
      setError('좌표 조회 실패: ' + (err as Error).message);
      setLoading(false);
    }
  };

  const fetchWeather = async (coords: Coordinates) => {
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

      setWeather({
        temp: Math.round(current.temperature_2m),
        description: weatherInfo.desc,
        icon: weatherInfo.icon,
      });
    } catch (err) {
      console.error('날씨 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-red-400/50 p-6 max-w-sm w-full shadow-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <span>⚠️</span> 오류
          </h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg font-semibold transition transform hover:scale-105"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  if (loading || !coordinates) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-slate-300 font-semibold">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden max-w-3xl w-full h-[700px] flex flex-col border border-white/10 shadow-2xl">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-white/10 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{address}</h2>
            <p className="text-sm text-slate-300">
              📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </p>
            {userLocation && travelInfo && (
              <p className="text-sm text-cyan-300 mt-2">
                🚗 현재 위치에서 {travelInfo.distance}km · {travelInfo.duration}분
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-slate-400 hover:text-white transition transform hover:scale-110"
          >
            ✕
          </button>
        </div>

        {/* 지도 */}
        <div className="flex-1 relative">
          <MapContainer
            center={[coordinates.lat, coordinates.lng] as [number, number]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              // @ts-ignore
            />
            <Marker position={[coordinates.lat, coordinates.lng]}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-slate-900">{address}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </p>
                  {travelInfo && (
                    <p className="text-sm text-blue-600 mt-2">
                      🚗 {travelInfo.distance}km · {travelInfo.duration}분
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-slate-900">현재 위치</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* 날씨 정보 + 닫기 버튼 */}
        {weather && (
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-t border-white/10 p-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="text-6xl">{weather.icon}</span>
                <div>
                  <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
                    {weather.temp}°C
                  </p>
                  <p className="text-slate-300 text-lg font-semibold mt-1">{weather.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-xl font-semibold transition transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 whitespace-nowrap"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

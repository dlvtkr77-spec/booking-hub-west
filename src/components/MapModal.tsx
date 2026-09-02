import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
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

export default function MapModal({ address, onClose }: MapModalProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoordinates();
  }, [address]);

  const fetchCoordinates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Nominatim API로 주소 → 좌표 변환
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

      // 날씨 정보 조회
      fetchWeather(coords);
    } catch (err) {
      setError('좌표 조회 실패: ' + (err as Error).message);
      setLoading(false);
    }
  };

  const fetchWeather = async (coords: Coordinates) => {
    try {
      // Open-Meteo API로 날씨 조회 (무료, 라이선스 불필요)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,weather_code&timezone=Asia/Seoul`
      );

      const data = await response.json();
      const current = data.current;

      // WMO 날씨 코드 → 설명
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h2 className="text-xl font-bold text-red-600 mb-4">오류</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  if (loading || !coordinates) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <p className="text-center text-gray-700">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg overflow-hidden max-w-2xl w-full h-[600px] flex flex-col">
        {/* 헤더 */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{address}</h2>
            <p className="text-sm mt-1">
              📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-70"
          >
            ✕
          </button>
        </div>

        {/* 지도 */}
        <div className="flex-1 relative">
          <MapContainer
            center={[coordinates.lat, coordinates.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            />
            <Marker position={[coordinates.lat, coordinates.lng]}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">{address}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* 날씨 정보 */}
        {weather && (
          <div className="bg-gray-50 p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{weather.icon}</span>
                <div>
                  <p className="text-2xl font-bold">{weather.temp}°C</p>
                  <p className="text-gray-600">{weather.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
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

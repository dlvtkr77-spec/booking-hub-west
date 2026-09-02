import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BookingForm from '../components/BookingForm';
import BookingTable from '../components/BookingTable';

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, pending: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // 통계 데이터 로드
  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('status');

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const bookings = data || [];
      const total = bookings.length;
      const confirmed = bookings.filter((b: any) => b.status === 'confirmed').length;
      const pending = bookings.filter((b: any) => b.status === 'pending').length;

      setStats({ total, confirmed, pending });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFormSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">예약 관리 허브</h1>
            <p className="text-sm text-gray-600 mt-1">관리자 모드</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">로그인된 사용자</p>
              <div className="flex items-center gap-2">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <p className="font-semibold text-gray-900">{user?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">전체 예약</h3>
            <p className="text-3xl font-bold text-blue-600">
              {statsLoading ? '...' : stats.total}
            </p>
            <p className="text-xs text-gray-400 mt-2">건</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">확정됨</h3>
            <p className="text-3xl font-bold text-green-600">
              {statsLoading ? '...' : stats.confirmed}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">대기 중</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {statsLoading ? '...' : stats.pending}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* 예약 폼과 테이블 */}
        <div className="bg-white rounded-lg shadow p-8">
          <BookingForm onSuccess={handleFormSuccess} />
          <BookingTable refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}

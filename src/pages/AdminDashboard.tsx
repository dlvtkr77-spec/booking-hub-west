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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 헤더 */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              예약 관리 허브
            </h1>
            <p className="text-sm text-slate-400 mt-2">관리자 대시보드</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest">관리자</p>
              <div className="flex items-center gap-3 mt-2">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full ring-2 ring-blue-400/50"
                  />
                )}
                <p className="font-semibold text-white">{user?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2.5 rounded-lg font-semibold transition transform hover:scale-105 duration-200 shadow-lg"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 전체 예약 */}
          <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-8 rounded-2xl border border-blue-400/20 hover:border-blue-400/40 transition duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">전체 예약</h3>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
              </div>
              <p className="text-5xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text">
                {statsLoading ? '...' : stats.total}
              </p>
              <p className="text-xs text-slate-400 mt-3">건의 예약</p>
            </div>
          </div>

          {/* 확정 */}
          <div className="group relative bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-8 rounded-2xl border border-emerald-400/20 hover:border-emerald-400/40 transition duration-300 hover:shadow-2xl hover:shadow-emerald-500/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">확정됨</h3>
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
              <p className="text-5xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text">
                {statsLoading ? '...' : stats.confirmed}
              </p>
              <p className="text-xs text-slate-400 mt-3">
                {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}% 완료율
              </p>
            </div>
          </div>

          {/* 대기 중 */}
          <div className="group relative bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-8 rounded-2xl border border-amber-400/20 hover:border-amber-400/40 transition duration-300 hover:shadow-2xl hover:shadow-amber-500/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">대기 중</h3>
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
              <p className="text-5xl font-bold text-transparent bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text">
                {statsLoading ? '...' : stats.pending}
              </p>
              <p className="text-xs text-slate-400 mt-3">
                {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% 대기율
              </p>
            </div>
          </div>
        </div>

        {/* 예약 폼과 테이블 */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
          <BookingForm onSuccess={handleFormSuccess} />
          <div className="border-t border-white/10 my-8"></div>
          <BookingTable refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}

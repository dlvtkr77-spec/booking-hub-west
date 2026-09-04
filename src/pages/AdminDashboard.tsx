import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BookingForm from '../components/BookingForm';
import BookingTable from '../components/BookingTable';
import PendingManagement from '../components/PendingManagement';
import DashboardTab from '../components/DashboardTab';

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'list' | 'pending'>('dashboard');

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
        {/* 탭 네비게이션 */}
        <div className="mb-6 flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'dashboard'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 대시보드
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'add'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✏️ 예약추가
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'list'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📅 예약목록
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'pending'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔄 미확정 관리
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        <div className={activeTab === 'dashboard' ? '' : 'bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl'}>
          {activeTab === 'dashboard' && <DashboardTab refreshKey={refreshKey} />}
          {activeTab === 'add' && <BookingForm onSuccess={handleFormSuccess} />}
          {activeTab === 'list' && <BookingTable refreshKey={refreshKey} />}
          {activeTab === 'pending' && <PendingManagement refreshKey={refreshKey} />}
        </div>
      </main>
    </div>
  );
}

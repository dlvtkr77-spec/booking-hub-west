import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import MapModal from './MapModal';
import BookingFilter from './BookingFilter';

interface Booking {
  id: number;
  customer: string;
  service: string;
  date: string;
  time: string;
  address?: string;
  status: string;
  kind?: string;
  form?: string;
  decision?: string;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  customer: string;
  statuses: string[];
  kinds: string[];
  forms: string[];
}

interface BookingTableProps {
  refreshKey?: number;
}

export default function BookingTable({ refreshKey }: BookingTableProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    customer: '',
    statuses: [],
    kinds: [],
    forms: [],
  });

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [refreshKey]);

  // 필터 적용
  useEffect(() => {
    let result = bookings;

    // 날짜 범위 필터
    if (filters.dateFrom) {
      result = result.filter((b) => b.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter((b) => b.date <= filters.dateTo);
    }

    // 고객사 필터
    if (filters.customer) {
      result = result.filter((b) =>
        b.customer.toLowerCase().includes(filters.customer.toLowerCase())
      );
    }

    // 상태 필터
    if (filters.statuses.length > 0) {
      result = result.filter((b) => filters.statuses.includes(b.decision || b.status));
    }

    // 종류 필터
    if (filters.kinds.length > 0) {
      result = result.filter((b) => filters.kinds.includes(b.kind || ''));
    }

    // 형태 필터
    if (filters.forms.length > 0) {
      result = result.filter((b) => filters.forms.includes(b.form || ''));
    }

    setFilteredBookings(result);
  }, [bookings, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const openMap = (address: string) => {
    if (!address) return;
    setSelectedAddress(address);
  };

  const toggleStatus = async (bookingId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';
    setUpdatingId(bookingId);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        alert('상태 변경 실패: ' + error.message);
      } else {
        // 로컬 상태 업데이트
        setBookings(
          bookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: newStatus }
              : booking
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">⏳ 로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center text-slate-400 py-12">📭 예약이 없습니다</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📅</span> 예약 목록
        </h3>
      </div>

      <BookingFilter onFilterChange={handleFilterChange} />

      {filteredBookings.length === 0 ? (
        <div className="text-center text-slate-400 py-8">🔍 필터 조건에 맞는 예약이 없습니다</div>
      ) : (
        <div className="mb-2 text-sm text-slate-400">
          전체 {bookings.length}건 중 {filteredBookings.length}건 표시
        </div>
      )}

      <div className="space-y-3">
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="group bg-gradient-to-r from-white/5 to-white/3 hover:from-white/10 hover:to-white/8 border border-white/10 rounded-xl p-5 transition duration-300 hover:border-white/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              {/* 고객사 */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">고객사</p>
                <p className="text-white font-semibold">{booking.customer}</p>
              </div>

              {/* 서비스 */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">서비스</p>
                <p className="text-white font-semibold">{booking.service}</p>
              </div>

              {/* 날짜 */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">날짜</p>
                <p className="text-white font-semibold">{booking.date}</p>
              </div>

              {/* 시간 */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">시간</p>
                <p className="text-white font-semibold">{booking.time}</p>
              </div>

              {/* 위치 */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">위치</p>
                {booking.address ? (
                  <button
                    onClick={() => openMap(booking.address || '')}
                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold underline transition flex items-center gap-1"
                  >
                    📍 {booking.address.length > 15 ? booking.address.substring(0, 15) + '...' : booking.address}
                  </button>
                ) : (
                  <span className="text-slate-500 text-sm">-</span>
                )}
              </div>

              {/* 상태 */}
              <div className="flex justify-end">
                <button
                  onClick={() => toggleStatus(booking.id, booking.status)}
                  disabled={updatingId === booking.id}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition transform duration-200 ${
                    booking.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 hover:bg-amber-500/30 hover:border-amber-400/70'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30 hover:border-emerald-400/70'
                  } ${updatingId === booking.id ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
                >
                  {updatingId === booking.id ? '⏳ 중...' : booking.status === 'pending' ? '⏳ 대기' : '✅ 확정'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 지도 모달 */}
      {selectedAddress && (
        <MapModal
          address={selectedAddress}
          onClose={() => setSelectedAddress(null)}
        />
      )}
    </div>
  );
}

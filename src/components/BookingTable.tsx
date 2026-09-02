import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import MapModal from './MapModal';

interface Booking {
  id: number;
  customer: string;
  service: string;
  date: string;
  time: string;
  address?: string;
  status: string;
}

interface BookingTableProps {
  refreshKey?: number;
}

export default function BookingTable({ refreshKey }: BookingTableProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
    return <div className="text-center text-gray-500">로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center text-gray-500">예약이 없습니다</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">고객사</th>
            <th className="border border-gray-300 px-4 py-2 text-left">서비스</th>
            <th className="border border-gray-300 px-4 py-2 text-left">날짜</th>
            <th className="border border-gray-300 px-4 py-2 text-left">시간</th>
            <th className="border border-gray-300 px-4 py-2 text-left">위치</th>
            <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{booking.customer}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.service}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.date}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.time}</td>
              <td className="border border-gray-300 px-4 py-2">
                {booking.address ? (
                  <button
                    onClick={() => openMap(booking.address || '')}
                    className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    📍 {booking.address}
                  </button>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <button
                  onClick={() => toggleStatus(booking.id, booking.status)}
                  disabled={updatingId === booking.id}
                  className={`px-3 py-1 rounded text-sm font-semibold cursor-pointer transition ${
                    booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  } ${updatingId === booking.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updatingId === booking.id
                    ? '업데이트중...'
                    : booking.status === 'pending'
                    ? '대기'
                    : '확정'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  customer: string;
  date: string;
  kind: string;
  form: string;
  memo: string;
  slot_assigned?: string;
  reason?: string;
  options?: string;
  decision: string;
}

interface StatusBoardProps {
  refreshKey?: number;
}

const STATUS_CONFIG: Record<
  string,
  { title: string; bg: string; textColor: string; icon: string }
> = {
  pending: {
    title: '대기',
    bg: 'bg-slate-500/20',
    textColor: 'text-slate-300',
    icon: '⏳',
  },
  confirmed_auto: {
    title: '확정-자동',
    bg: 'bg-emerald-500/20',
    textColor: 'text-emerald-300',
    icon: '✅',
  },
  confirmed_human: {
    title: '확정-수동',
    bg: 'bg-emerald-500/20',
    textColor: 'text-emerald-300',
    icon: '🤝',
  },
  review: {
    title: '검토',
    bg: 'bg-yellow-500/20',
    textColor: 'text-yellow-300',
    icon: '⚠️',
  },
  rejected: {
    title: '기각',
    bg: 'bg-red-500/20',
    textColor: 'text-red-300',
    icon: '❌',
  },
  asking: {
    title: '질문',
    bg: 'bg-blue-500/20',
    textColor: 'text-blue-300',
    icon: 'ℹ️',
  },
};

const STATUS_ORDER = ['pending', 'confirmed_auto', 'confirmed_human', 'review', 'rejected', 'asking'];

export default function StatusBoard({ refreshKey }: StatusBoardProps) {
  const [bookingsByStatus, setBookingsByStatus] = useState<Record<string, Booking[]>>({
    pending: [],
    confirmed_auto: [],
    confirmed_human: [],
    review: [],
    rejected: [],
    asking: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();

    const channel = supabase.channel('bookings-board-status');
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshKey]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bookings').select('*');

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    const grouped: Record<string, Booking[]> = {
      pending: [],
      confirmed_auto: [],
      confirmed_human: [],
      review: [],
      rejected: [],
      asking: [],
    };

    (data || []).forEach((booking: any) => {
      const status = booking.decision || 'pending';
      if (status in grouped) {
        grouped[status].push(booking);
      }
    });

    setBookingsByStatus(grouped);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">⏳ 로딩 중...</div>;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">상태 보드</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const bookings = bookingsByStatus[status] || [];

          return (
            <div
              key={status}
              className={`rounded-lg border border-white/10 overflow-hidden min-h-[400px] flex flex-col`}
            >
              {/* 헤더 */}
              <div className={`${config.bg} p-4 border-b border-white/10`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{config.icon}</span>
                  <h4 className={`font-semibold ${config.textColor}`}>{config.title}</h4>
                </div>
                <p className="text-2xl font-bold text-white">{bookings.length}</p>
              </div>

              {/* 카드 리스트 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {bookings.length === 0 ? (
                  <div className="text-center text-slate-500 py-8 text-xs">비어있음</div>
                ) : (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-slate-900/50 border border-slate-700 rounded p-2 text-xs space-y-1"
                    >
                      <p className="font-semibold text-white truncate">{booking.customer}</p>
                      <p className="text-slate-400">
                        {booking.date} {booking.kind} {booking.form}
                      </p>
                      <p className="text-slate-300">{booking.memo}</p>

                      {booking.slot_assigned && (
                        <p className="text-emerald-300 font-semibold">{booking.slot_assigned}</p>
                      )}

                      {booking.reason && !booking.slot_assigned && (
                        <p className="text-slate-400 line-clamp-2">{booking.reason}</p>
                      )}

                      {booking.options && (
                        <p className="text-slate-400 text-xs">
                          <span className="font-semibold">옵션:</span> {booking.options}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

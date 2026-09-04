import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { decide } from '../lib/decide';

interface Booking {
  id: number;
  customer: string;
  kind: string;
  date: string;
  slots_wanted?: string;
  decision?: string;
  reason?: string;
  options?: string;
  slot_assigned?: string;
  candidate?: string;
  trace?: string;
}

interface PendingManagementProps {
  refreshKey?: number;
}

const DECISION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-slate-500/20', text: 'text-slate-300', icon: '⏳' },
  confirmed_auto: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', icon: '✅' },
  confirmed_human: { bg: 'bg-emerald-500/20 border-2 border-emerald-400', text: 'text-emerald-300', icon: '🤝' },
  review: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', icon: '⚠️' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-300', icon: '❌' },
  asking: { bg: 'bg-blue-500/20', text: 'text-blue-300', icon: 'ℹ️' },
};

export default function PendingManagement({ refreshKey }: PendingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAndDecide();
  }, [refreshKey]);

  const fetchAndDecide = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bookings').select('*');

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      const allBookings = (data || []) as Booking[];

      // 미확정 상태의 예약만 필터링
      const pendingBookings = allBookings.filter(
        (b) => ['pending', 'review', 'rejected', 'asking'].includes(b.decision || '')
      );

      // 각 예약에 대해 판정 실행
      const decidedBookings = pendingBookings.map((booking) => {
        const result = decide(booking, allBookings, false);
        return {
          ...booking,
          decision: result.decision,
          reason: result.reason,
          options: result.options?.join(','),
          candidate: result.candidate?.join(','),
          trace: result.trace.join('\n'),
        };
      });

      setBookings(decidedBookings);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmHuman = async (bookingId: number, slotAssigned?: string) => {
    if (!slotAssigned) return;

    setConfirmingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          decision: 'confirmed_human',
          slot_assigned: slotAssigned,
        })
        .eq('id', bookingId);

      if (error) {
        alert('확정 실패: ' + error.message);
        return;
      }

      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, decision: 'confirmed_human', slot_assigned: slotAssigned } : b
        )
      );
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReviewDecision = async (selectedCustomer: string, otherCustomer: string) => {
    const selectedBooking = bookings.find((b) => b.customer === selectedCustomer);
    const otherBooking = bookings.find((b) => b.customer === otherCustomer);

    if (!selectedBooking || !otherBooking) return;

    try {
      // 선택된 쪽: confirmed_human
      if (selectedBooking.candidate) {
        const { error: error1 } = await supabase
          .from('bookings')
          .update({
            decision: 'confirmed_human',
            slot_assigned: selectedBooking.candidate,
          })
          .eq('id', selectedBooking.id);

        if (error1) throw error1;
      }

      // 다른 쪽: pending 으로 리셋
      const { error: error2 } = await supabase
        .from('bookings')
        .update({
          decision: 'pending',
          slot_assigned: null,
        })
        .eq('id', otherBooking.id);

      if (error2) throw error2;

      await fetchAndDecide();
    } catch (error: any) {
      alert('처리 실패: ' + (error?.message || '알 수 없는 오류'));
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">⏳ 로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center text-slate-400 py-12">✨ 모든 예약이 확정되었습니다</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🔄</span> 미확정 관리 ({bookings.length}건)
        </h3>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => {
          const color = DECISION_COLORS[booking.decision || 'pending'];
          const isReview = booking.decision === 'review';
          const options = booking.options?.split(',').filter(Boolean) || [];
          const candidate = booking.candidate?.split(',').filter(Boolean) || [];

          return (
            <div
              key={booking.id}
              className="bg-gradient-to-r from-white/5 to-white/3 hover:from-white/10 hover:to-white/8 border border-white/10 rounded-xl p-5 transition duration-300 hover:border-white/20"
            >
              <div className="flex items-start gap-4">
                {/* 배지 */}
                <div
                  className={`flex-shrink-0 ${color.bg} ${color.text} px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-1 h-fit`}
                >
                  <span>{color.icon}</span>
                  {booking.decision === 'pending' && '대기'}
                  {booking.decision === 'confirmed_auto' && '자동'}
                  {booking.decision === 'confirmed_human' && '수동'}
                  {booking.decision === 'review' && '검토'}
                  {booking.decision === 'rejected' && '거절'}
                  {booking.decision === 'asking' && '질문'}
                </div>

                {/* 정보 */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">고객사</p>
                      <p className="text-white font-semibold">{booking.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">종류 / 날짜</p>
                      <p className="text-white font-semibold">
                        {booking.kind} / {booking.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">희망 슬롯</p>
                      <p className="text-white font-semibold">{booking.slots_wanted || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">상태</p>
                      <p className="text-white font-semibold">{booking.reason}</p>
                    </div>
                  </div>

                  {/* pending: 확정 버튼 */}
                  {booking.decision === 'pending' && candidate.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleConfirmHuman(booking.id, candidate.join(','))}
                        disabled={confirmingId === booking.id}
                        className="px-4 py-2 bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 rounded-lg hover:bg-emerald-500/40 disabled:opacity-60 transition font-semibold text-sm"
                      >
                        {confirmingId === booking.id ? '⏳ 중...' : `✅ 확정 (${candidate.join('+')})`}
                      </button>
                    </div>
                  )}

                  {/* review: 두 개의 옵션 버튼 */}
                  {isReview && options.length === 2 && (
                    <div className="flex gap-2 mt-3">
                      {options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleReviewDecision(option, options.find((o) => o !== option) || '')}
                          className="px-4 py-2 bg-yellow-500/30 text-yellow-300 border border-yellow-400/50 rounded-lg hover:bg-yellow-500/40 transition font-semibold text-sm"
                        >
                          {option} 쪽으로 확정
                        </button>
                      ))}
                    </div>
                  )}

                  {/* rejected: 옵션 목록 */}
                  {booking.decision === 'rejected' && options.length > 0 && (
                    <div className="mt-3 text-sm text-slate-300">
                      <p className="font-semibold mb-1">빈 칸:</p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((opt) => (
                          <span key={opt} className="px-2 py-1 bg-slate-500/30 rounded text-slate-200 text-xs">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 과정 보기 */}
                  <button
                    onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline transition"
                  >
                    {expandedId === booking.id ? '▼ 과정 숨기기' : '▶ 과정 보기'}
                  </button>

                  {expandedId === booking.id && booking.trace && (
                    <div className="mt-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                      <ol className="text-xs text-slate-300 space-y-1 font-mono list-decimal list-inside">
                        {booking.trace.split('\n').map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

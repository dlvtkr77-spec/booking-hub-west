import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { decide } from '../lib/decide';
import { addEventToGoogleCalendar } from '../lib/googleCalendar';
import { slotToTime } from '../lib/slotToTime';
import WorkflowGraph from './WorkflowGraph';
import JudgmentLog from './JudgmentLog';
import StatusBoard from './StatusBoard';

interface Booking {
  id: number;
  customer: string;
  kind: string;
  date: string;
  slots_wanted?: string;
  decision?: string;
  reason?: string;
  trace?: string;
  memo?: string;
  address?: string;
}

export default function DashboardTab() {
  const [autoJudge, setAutoJudge] = useState(() => {
    const saved = localStorage.getItem('auto-judge');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lastTransition, setLastTransition] = useState<{ from?: string; to: string; timestamp: number } | undefined>();
  const [refreshLog, setRefreshLog] = useState(0);
  const [refreshBoard, setRefreshBoard] = useState(0);

  useEffect(() => {
    localStorage.setItem('auto-judge', JSON.stringify(autoJudge));
  }, [autoJudge]);

  const handleJudgeAll = async () => {
    try {
      const { data: bookings, error } = await supabase.from('bookings').select('*');

      if (error) {
        alert('조회 실패: ' + error.message);
        return;
      }

      const allBookings = (bookings || []) as Booking[];
      const pendingBookings = allBookings.filter((b) => b.decision === 'pending');

      for (const booking of pendingBookings) {
        const result = decide(booking, allBookings, autoJudge);
        console.log(`Judging booking ${booking.id}:`, result);

        const previousDecision = booking.decision;
        const updateData: Record<string, any> = {
          decision: result.decision,
          reason: result.reason,
          trace: result.trace.join('\n'),
        };

        // options는 rejected일 때만 저장
        if (result.options) {
          updateData.options = result.options.join(',');
        }

        // slot_assigned는 confirmed일 때만 저장
        if (result.slotAssigned) {
          updateData.slot_assigned = result.slotAssigned.join(',');
        }
        console.log(`Update data for booking ${booking.id}:`, updateData);

        const { error: updateError } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', booking.id);

        if (updateError) {
          console.error('Error updating booking:', updateError);
          continue;
        }

        console.log(`Successfully updated booking ${booking.id}`);
        setLastTransition({
          from: previousDecision,
          to: result.decision,
          timestamp: Date.now(),
        });

        // confirmed 상태면 Google Calendar에 추가
        if (result.decision === 'confirmed_auto' || result.decision === 'confirmed_human') {
          const slotStr = result.slotAssigned?.[0] || '오전';
          const time = slotToTime(slotStr);

          console.log(`Adding to Google Calendar: ${booking.customer} on ${booking.date} at ${time}`);
          await addEventToGoogleCalendar({
            customer: booking.customer,
            service: booking.memo || booking.customer,
            date: booking.date,
            time: time,
            address: booking.address || '',
          });
        }

        setRefreshLog((prev) => prev + 1);
        setRefreshBoard((prev) => prev + 1);
      }

      alert(`${pendingBookings.length}건의 예약을 판정했습니다`);
    } catch (error) {
      alert('판정 실패: ' + String(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* 컨트롤 바 */}
      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoJudge}
            onChange={(e) => setAutoJudge(e.target.checked)}
            className="w-5 h-5 rounded accent-blue-500"
          />
          <span className="text-white font-semibold">자동 판정</span>
        </label>

        <button
          onClick={handleJudgeAll}
          className="ml-auto px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition transform hover:scale-105"
        >
          🔄 전부 판정
        </button>
      </div>

      {/* 워크플로 그래프 */}
      <WorkflowGraph lastTransition={lastTransition} />

      {/* 판정 로그 */}
      <JudgmentLog refreshKey={refreshLog} />

      {/* 상태 보드 */}
      <StatusBoard refreshKey={refreshBoard} />
    </div>
  );
}

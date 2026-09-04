import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LogEntry {
  id: number;
  customer: string;
  decision: string;
  trace: string;
  timestamp: number;
}

interface JudgmentLogProps {
  refreshKey?: number;
}

const DECISION_BADGES: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-slate-500/20', text: 'text-slate-300', icon: '⏳' },
  confirmed_auto: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', icon: '✅' },
  confirmed_human: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', icon: '🤝' },
  review: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', icon: '⚠️' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-300', icon: '❌' },
  asking: { bg: 'bg-blue-500/20', text: 'text-blue-300', icon: 'ℹ️' },
};

export default function JudgmentLog({ refreshKey }: JudgmentLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const channel = supabase.channel('bookings-board-log');
    channel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload: any) => {
          const newBooking = payload.new;
          if (newBooking.decision && newBooking.trace) {
            const newLog: LogEntry = {
              id: newBooking.id,
              customer: newBooking.customer,
              decision: newBooking.decision,
              trace: newBooking.trace,
              timestamp: Date.now(),
            };
            setLogs((prev) => [newLog, ...prev.slice(0, 11)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshKey]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR');
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">판정 로그</h3>
        <div className="text-center text-slate-400 py-8">📭 아직 판정 기록이 없습니다</div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">판정 로그 (최근 12건)</h3>
      <div className="space-y-2">
        {logs.map((log) => {
          const badge = DECISION_BADGES[log.decision] || DECISION_BADGES.pending;
          const traceLines = log.trace.split('\n').filter((line) => line.trim());

          return (
            <div
              key={log.id}
              className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">{formatTime(log.timestamp)}</span>
                    <span className="font-semibold text-white">{log.customer}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${badge.bg} ${badge.text}`}
                    >
                      {badge.icon} {log.decision}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  className="text-blue-400 hover:text-blue-300 text-xs underline transition"
                >
                  {expandedId === log.id ? '▼' : '▶'}
                </button>
              </div>

              {expandedId === log.id && (
                <div className="mt-2 p-2 bg-slate-950/50 rounded border border-slate-700">
                  <ol className="text-xs text-slate-300 space-y-1 font-mono list-decimal list-inside">
                    {traceLines.map((line, idx) => (
                      <li key={idx} className="text-slate-400">
                        {line}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendSlackNotification } from '../lib/slack';
import { addEventToGoogleCalendar } from '../lib/googleCalendar';
import { judge } from '../lib/judge';

interface BookingFormProps {
  onSuccess?: () => void;
}

const SLOT_OPTIONS = [
  { label: '오전 10-12', value: '오전' },
  { label: '오후-1 13-15', value: '오후-1' },
  { label: '오후-2 15-17', value: '오후-2' },
];

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [formData, setFormData] = useState({
    customer: '',
    kind: '',
    form: '',
    memo: '',
    address: '',
    date: '',
  });
  const [slotsWanted, setSlotsWanted] = useState<string[]>([]);
  const [slotOrder, setSlotOrder] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSlotToggle = (slotValue: string) => {
    setSlotsWanted((prev) => {
      const newSlots = prev.includes(slotValue)
        ? prev.filter((s) => s !== slotValue)
        : [...prev, slotValue];

      const newOrder: Record<string, number> = {};
      newSlots.forEach((slot, idx) => {
        newOrder[slot] = idx + 1;
      });
      setSlotOrder(newOrder);

      return newSlots;
    });
  };

  const judgeResult = judge({
    customer: formData.customer,
    kind: formData.kind,
    form: formData.form,
    date: formData.date,
    address: formData.address,
    slotsWanted,
  });

  const isFormValid = judgeResult.route === 'book';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid) {
      setError(judgeResult.message || '모든 필드를 입력해주세요');
      return;
    }

    setLoading(true);
    const slotsWantedStr = slotsWanted.join(',');

    const { error: insertError } = await supabase
      .from('bookings')
      .insert([
        {
          customer: formData.customer,
          kind: formData.kind,
          form: formData.form,
          memo: formData.memo,
          address: formData.address,
          date: formData.date,
          time: '',
          slots_wanted: slotsWantedStr,
          decision: 'pending',
          status: 'pending',
          service: formData.memo,
          via: 'form',
        },
      ]);

    if (insertError) {
      const errorMsg = insertError.message || JSON.stringify(insertError);
      setError(`예약 추가 실패: ${errorMsg}`);
      console.error('Error inserting booking:', errorMsg);
      console.error('Full error object:', insertError);
    } else {
      console.log('✅ Booking added successfully, sending notifications...');

      sendSlackNotification({
        customer: formData.customer,
        service: formData.memo,
        date: formData.date,
        time: '',
        address: formData.address,
        status: 'pending',
      });

      addEventToGoogleCalendar({
        customer: formData.customer,
        service: formData.memo,
        date: formData.date,
        time: '',
        address: formData.address,
      });
      console.log('✓ Google Calendar function called');

      setFormData({
        customer: '',
        kind: '',
        form: '',
        memo: '',
        address: '',
        date: '',
      });
      setSlotsWanted([]);
      setSlotOrder({});
      setError('');
      if (onSuccess) {
        onSuccess();
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">✏️</span>
        <h2 className="text-2xl font-bold text-white">새 예약 추가</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl text-red-300 text-sm backdrop-blur-sm">
          <span className="font-semibold">⚠️ </span>{error}
        </div>
      )}

      {judgeResult.message && (
        <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/50 rounded-xl text-blue-300 text-sm backdrop-blur-sm">
          <span className="font-semibold">ℹ️ </span>{judgeResult.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          name="customer"
          placeholder="고객사"
          value={formData.customer}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        />

        <select
          name="kind"
          value={formData.kind}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        >
          <option value="">종류 선택</option>
          <option value="서울">서울</option>
          <option value="경기">경기</option>
          <option value="지방">지방</option>
          <option value="내부">내부</option>
        </select>

        <select
          name="form"
          value={formData.form}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        >
          <option value="">형태 선택</option>
          <option value="외근">외근</option>
          <option value="온라인">온라인</option>
        </select>

        <input
          type="text"
          name="memo"
          placeholder="메모 (예: 미팅, 기획 회의)"
          value={formData.memo}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        />

        {formData.form === '외근' && (
          <input
            type="text"
            name="address"
            placeholder="위치"
            value={formData.address}
            onChange={handleChange}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
          />
        )}

        {formData.form === '온라인' && (
          <input
            type="text"
            name="address"
            placeholder="위치 (선택사항)"
            value={formData.address}
            onChange={handleChange}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
          />
        )}

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        />
      </div>

      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
        <label className="block text-white font-semibold mb-3">희망 슬롯</label>
        <div className="space-y-2">
          {SLOT_OPTIONS.map((slot) => (
            <label key={slot.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={slotsWanted.includes(slot.value)}
                onChange={() => handleSlotToggle(slot.value)}
                className="w-4 h-4 rounded bg-white/10 border border-white/20 checked:bg-blue-500 cursor-pointer"
              />
              <span className="text-white">{slot.label}</span>
              {slotOrder[slot.value] && (
                <span className="ml-auto text-blue-400 font-semibold">{slotOrder[slot.value]}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full py-3 px-6 rounded-xl font-semibold transition transform duration-200 ${
          isFormValid && !loading
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 cursor-pointer'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
        }`}
      >
        {loading ? '⏳ 예약 중...' : '🎯 예약하기'}
      </button>
    </form>
  );
}

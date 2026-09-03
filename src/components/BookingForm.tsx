import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendSlackNotification } from '../lib/slack';
import { addEventToGoogleCalendar } from '../lib/googleCalendar';

interface BookingFormProps {
  onSuccess?: () => void;
}

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [formData, setFormData] = useState({
    customer: '',
    service: '',
    date: '',
    time: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const isAddressValid = (address: string) => {
    // 주소 유효성: 최소 2글자, 특수문자 검증
    return address.trim().length >= 2 && /^[가-힣a-zA-Z0-9\s,\-()]+$/.test(address);
  };

  const isFormValid =
    Object.values(formData).every((val) => val.trim() !== '') &&
    isAddressValid(formData.address);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    setLoading(true);
    const { error: insertError } = await supabase
      .from('bookings')
      .insert([
        {
          customer: formData.customer,
          service: formData.service,
          date: formData.date,
          time: formData.time,
          address: formData.address,
          via: 'form',
        },
      ]);

    if (insertError) {
      const errorMsg = insertError.message || JSON.stringify(insertError);
      setError(`예약 추가 실패: ${errorMsg}`);
      console.error('Error inserting booking:', errorMsg);
      console.error('Full error object:', insertError);
    } else {
      // Slack에 알림 전송 (비동기)
      sendSlackNotification({
        customer: formData.customer,
        service: formData.service,
        date: formData.date,
        time: formData.time,
        address: formData.address,
        status: 'pending',
      });

      // Google Calendar에 이벤트 추가 (비동기)
      addEventToGoogleCalendar({
        customer: formData.customer,
        service: formData.service,
        date: formData.date,
        time: formData.time,
        address: formData.address,
      });

      setFormData({
        customer: '',
        service: '',
        date: '',
        time: '',
        address: '',
      });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          name="customer"
          placeholder="고객사"
          value={formData.customer}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        />
        <input
          type="text"
          name="service"
          placeholder="서비스"
          value={formData.service}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        />
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm"
        />
        <input
          type="text"
          name="address"
          placeholder="주소 (한글, 영문, 숫자, 쉼표, 하이픈, 괄호만 가능)"
          value={formData.address}
          onChange={handleChange}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition backdrop-blur-sm md:col-span-2"
        />
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full py-3 px-6 rounded-xl font-semibold transition transform duration-200 ${
          isFormValid && !loading
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 cursor-pointer'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
        }`}
      >
        {loading ? '⏳ 예약 중...' : '🎯 예약하기'}
      </button>
    </form>
  );
}

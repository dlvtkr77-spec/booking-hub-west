import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-300 mb-6">
      <h2 className="text-2xl font-bold mb-4">새 예약 추가</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          name="customer"
          placeholder="고객사"
          value={formData.customer}
          onChange={handleChange}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          name="service"
          placeholder="서비스"
          value={formData.service}
          onChange={handleChange}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          name="address"
          placeholder="주소"
          value={formData.address}
          onChange={handleChange}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
        />
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full py-2 px-4 rounded font-semibold transition ${
          isFormValid && !loading
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? '예약 중...' : '예약하기'}
      </button>
    </form>
  );
}

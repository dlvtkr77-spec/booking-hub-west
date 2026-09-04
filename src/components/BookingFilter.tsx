import { useState } from 'react';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  customer: string;
  statuses: string[];
  kinds: string[];
  forms: string[];
}

interface BookingFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

const STATUS_OPTIONS = ['pending', 'confirmed_auto', 'confirmed_human', 'review', 'rejected', 'asking'];
const KIND_OPTIONS = ['서울', '경기', '지방', '내부'];
const FORM_OPTIONS = ['외근', '온라인'];

export default function BookingFilter({ onFilterChange }: BookingFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    customer: '',
    statuses: [],
    kinds: [],
    forms: [],
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCustomerChange = (value: string) => {
    const newFilters = { ...filters, customer: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    const newFilters = { ...filters, statuses: newStatuses };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleKind = (kind: string) => {
    const newKinds = filters.kinds.includes(kind)
      ? filters.kinds.filter((k) => k !== kind)
      : [...filters.kinds, kind];
    const newFilters = { ...filters, kinds: newKinds };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleForm = (form: string) => {
    const newForms = filters.forms.includes(form)
      ? filters.forms.filter((f) => f !== form)
      : [...filters.forms, form];
    const newFilters = { ...filters, forms: newForms };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      dateFrom: '',
      dateTo: '',
      customer: '',
      statuses: [],
      kinds: [],
      forms: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-4">
      {/* 기본 필터 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 날짜 범위 */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">
            시작 날짜
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">
            종료 날짜
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
        </div>

        {/* 고객사 검색 */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">
            고객사 검색
          </label>
          <input
            type="text"
            placeholder="고객사명..."
            value={filters.customer}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
        </div>
      </div>

      {/* 고급 필터 */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-400 hover:text-blue-300 transition"
      >
        {showAdvanced ? '▼ 상세 필터 숨기기' : '▶ 상세 필터 보기'}
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          {/* 상태 필터 */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">
              상태
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    filters.statuses.includes(status)
                      ? 'bg-blue-500/40 text-blue-300 border border-blue-400'
                      : 'bg-white/10 text-slate-400 border border-white/20 hover:border-white/30'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* 종류 필터 */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">
              종류
            </label>
            <div className="flex flex-wrap gap-2">
              {KIND_OPTIONS.map((kind) => (
                <button
                  key={kind}
                  onClick={() => toggleKind(kind)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    filters.kinds.includes(kind)
                      ? 'bg-blue-500/40 text-blue-300 border border-blue-400'
                      : 'bg-white/10 text-slate-400 border border-white/20 hover:border-white/30'
                  }`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>

          {/* 형태 필터 */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">
              형태
            </label>
            <div className="flex flex-wrap gap-2">
              {FORM_OPTIONS.map((form) => (
                <button
                  key={form}
                  onClick={() => toggleForm(form)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    filters.forms.includes(form)
                      ? 'bg-blue-500/40 text-blue-300 border border-blue-400'
                      : 'bg-white/10 text-slate-400 border border-white/20 hover:border-white/30'
                  }`}
                >
                  {form}
                </button>
              ))}
            </div>
          </div>

          {/* 리셋 버튼 */}
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition font-semibold text-sm"
          >
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}

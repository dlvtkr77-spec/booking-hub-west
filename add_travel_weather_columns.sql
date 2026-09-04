-- Supabase SQL Editor에 복사해서 실행하세요
-- bookings 테이블에 이동 시간·거리·날씨 컬럼 추가

-- 1. 새 컬럼 추가
alter table bookings add column if not exists travel_time integer;
alter table bookings add column if not exists travel_distance numeric(5,1);
alter table bookings add column if not exists weather text;

-- 2. 선택 컬럼 추가 (reviewer 및 trace 관련)
alter table bookings add column if not exists slot_assigned text;
alter table bookings add column if not exists trace text;

-- 이 마이그레이션 후:
-- - travel_time: 예상 이동 시간 (분)
-- - travel_distance: 이동 거리 (km, 소수점 1자리)
-- - weather: 목적지 날씨 (예: "☀️ 23°C 맑음")
-- - slot_assigned: 확정된 슬롯 ("오전+오후-1" 형태)
-- - trace: 판정 과정 로그 (줄 바꿈으로 구분)

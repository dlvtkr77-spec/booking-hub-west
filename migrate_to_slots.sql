-- Supabase SQL Editor에 복사해서 실행하세요
-- 기존 bookings 테이블에 새 컬럼 추가 (슬롯 모델)

-- 1. 새 컬럼 추가
alter table bookings add column kind text;
alter table bookings add column form text;
alter table bookings add column memo text;
alter table bookings add column slots_wanted text;
alter table bookings add column decision text default 'pending';

-- 2. 기존 데이터를 위해 service와 date만 필수로 유지
-- customer도 필수로 변경 (새로운 요구사항)
alter table bookings alter column customer set not null;
alter table bookings alter column service drop not null;

-- 이 마이그레이션 후:
-- - customer: 고객사 (필수)
-- - kind: 종류 - 서울/경기/지방/내부 (필수)
-- - form: 형태 - 외근/온라인 (필수)
-- - memo: 메모 (필수)
-- - address: 위치 (외근일 때 필수, 온라인일 때 선택)
-- - date: 날짜 (필수)
-- - time: 빈 문자열 저장 (예약 슬롯 시스템에서 사용 안 함)
-- - slots_wanted: 체크한 슬롯 쉼표 구분 예: "오전,오후-1"
-- - decision: 'pending' (대기 중)
-- - status: 'pending' (기본값)
-- - service: memo와 동일하게 저장
-- - via: 'form' (기본값)
-- - created_at: 자동 생성

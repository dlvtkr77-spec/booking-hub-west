-- admin_users 테이블 생성
-- Supabase SQL Editor에 붙여넣고 Run 실행

create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  created_at timestamptz default now()
);

-- Row Level Security 활성화
alter table admin_users enable row level security;

-- 모든 인증된 사용자가 읽을 수 있음 (로그인 확인용)
create policy "admin_users_read_auth" on admin_users
  for select
  using (auth.role() = 'authenticated');

-- 자신의 데이터만 읽을 수 있음 (로그인되지 않은 사용자도 자신 확인 가능)
create policy "admin_users_read_self" on admin_users
  for select
  using (id = auth.uid());

-- 관리자만 관리자 목록 수정 가능
create policy "admin_users_insert" on admin_users
  for insert
  with check (auth.uid() in (select id from admin_users));

-- 관리자만 수정 가능
create policy "admin_users_update" on admin_users
  for update
  using (auth.uid() in (select id from admin_users))
  with check (auth.uid() in (select id from admin_users));

-- 관리자만 삭제 가능
create policy "admin_users_delete" on admin_users
  for delete
  using (auth.uid() in (select id from admin_users));

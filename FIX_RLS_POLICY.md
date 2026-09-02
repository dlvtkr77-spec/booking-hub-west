# admin_users RLS 정책 수정 가이드

## 문제
로그인할 때 admin_users 테이블에서 406 에러 발생

## 원인
기존 RLS 정책이 로그인 전 사용자(anon)의 읽기를 차단했습니다.

---

## 해결 방법 (3단계)

### 1단계: 기존 정책 삭제
Supabase 대시보드에서:

1. **Table Editor** → **admin_users** 테이블 선택
2. **Policies** 탭 클릭
3. 다음 정책들을 삭제:
   - ❌ `admin_users_read` (삭제)
   - ❌ `admin_users_insert` (삭제)  
   - ❌ `admin_users_update` (삭제)
   - ❌ `admin_users_delete` (삭제)

각 정책 옆의 **...** 메뉴 → **Delete** 클릭

### 2단계: 새 정책 추가
Supabase SQL Editor에 다음을 붙여넣고 **Run** 클릭:

```sql
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
```

### 3단계: 확인
1. **Table Editor** → **admin_users** → **Policies** 탭
2. 다음 정책들이 있는지 확인:
   - ✅ `admin_users_read_auth`
   - ✅ `admin_users_read_self`
   - ✅ `admin_users_insert`
   - ✅ `admin_users_update`
   - ✅ `admin_users_delete`

---

## 테스트

1. 브라우저에서 F12 → Local Storage → localhost:5173 모두 삭제
2. http://localhost:5173/login 새로고침
3. Google 로그인 시도
4. ✅ 이제 "이 계정은 관리자로 등록되어 있지 않습니다" 메시지 또는 관리자 대시보드가 보여야 함

---

## 정책 설명

| 정책 | 역할 | 조건 |
|------|------|------|
| `admin_users_read_auth` | SELECT | 인증된 모든 사용자 |
| `admin_users_read_self` | SELECT | 자신의 ID만 |
| `admin_users_insert` | INSERT | 이미 관리자인 경우만 |
| `admin_users_update` | UPDATE | 이미 관리자인 경우만 |
| `admin_users_delete` | DELETE | 이미 관리자인 경우만 |

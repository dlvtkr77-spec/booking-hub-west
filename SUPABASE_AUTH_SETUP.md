# Supabase Authentication 설정 가이드

## 1단계: admin_users 테이블 생성

Supabase 대시보드 → SQL Editor에서 `admin_users.sql` 파일의 모든 내용을 복사하여 붙여넣고 **Run** 클릭.

```sql
create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  created_at timestamptz default now()
);
```

## 2단계: Google OAuth 설정

### 2-1. Supabase에서 Google 제공자 활성화
1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Google** 검색 → **Enable** 클릭
3. Google OAuth 2.0 클라이언트 ID/보안 암호 입력
   - Google Cloud Console에서 생성한 클라이언트 ID/보안 암호 복사

### 2-2. Google Cloud Console에서 승인된 리디렉션 URI 추가
1. Google Cloud Console → OAuth 2.0 클라이언트 ID
2. **승인된 리디렉션 URI** 섹션에 다음 추가:
   ```
   http://localhost:5173/
   http://localhost:5173/admin
   https://your-domain.com/
   https://your-domain.com/admin
   ```
   (localhost 주소는 개발용, your-domain.com은 실제 배포 시 변경)

## 3단계: 관리자 사용자 추가

### 3-1. Supabase로 Google 로그인
1. 앱에서 Google 로그인 수행
2. Supabase 대시보드 → **Authentication** → **Users**에 사용자 생성됨 확인

### 3-2. admin_users 테이블에 관리자 등록
Supabase 대시보드 → **Table Editor** → **admin_users** → **Insert row**

```json
{
  "id": "사용자 UUID (auth.users에서 복사)",
  "email": "your-email@gmail.com",
  "full_name": "관리자 이름 (선택사항)"
}
```

#### UUID 찾기:
1. **Authentication** → **Users** 에서 등록된 사용자 클릭
2. User ID 복사

## 4단계: 테스트

1. 브라우저 개발자 도구 (F12) → Console 열기
2. http://localhost:5173/login 접속
3. Google 로그인 버튼 클릭
4. 로그인 후:
   - ✅ admin_users 테이블에 등록된 이메일: `/admin` 페이지 표시
   - ❌ admin_users 테이블에 없는 이메일: 로그아웃 후 "접근 거부" 메시지

## 5단계: 문제 해결

### "Google로 로그인할 수 없습니다" 에러
- Google Cloud Console에서 리디렉션 URI 확인
- Supabase Google 제공자 설정에서 클라이언트 ID/보안 암호 확인

### admin_users 테이블에 등록했는데 로그인 안 됨
1. Supabase 대시보드 → **Authentication** → **Policies**
2. `admin_users` 테이블의 정책 확인
3. 다음 정책이 모두 생성되었는지 확인:
   - `admin_users_read`
   - `admin_users_insert`
   - `admin_users_update`
   - `admin_users_delete`

### 콘솔에 "admin check failed" 에러
- 사용자의 UUID가 admin_users 테이블의 id와 정확히 일치하는지 확인
- Supabase 대시보드 → **Table Editor** → **admin_users**에서 데이터 확인

## 구조 다이어그램

```
사용자 → Google 로그인
       ↓
   Supabase Auth (Google OAuth)
       ↓
   auth.users 테이블에 사용자 저장
       ↓
   admin_users 테이블에서 관리자 확인
       ↓
   ✅ 관리자: /admin 페이지 접근 허용
   ❌ 일반 사용자: 로그아웃 후 거부
```

## 보안 특징

- ✅ Supabase Row Level Security (RLS)로 데이터 보호
- ✅ 관리자만 admin_users 테이블 수정 가능
- ✅ Google OAuth로 안전한 인증
- ✅ 클라이언트-서버 검증 (서버에서 최종 확인)

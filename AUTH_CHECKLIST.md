# Supabase Authentication 설정 체크리스트

## ✅ 이미 완료된 작업

- [x] AuthContext 구현 (Supabase Auth 통합)
- [x] LoginPage 구현 (Google OAuth)
- [x] ProtectedRoute 구현 (관리자 전용 페이지 보호)
- [x] AdminDashboard 구현
- [x] admin_users.sql 생성 (테이블 + RLS 정책)
- [x] .env 설정

## 🔧 수동으로 해야 할 작업

### 1단계: Supabase에 admin_users 테이블 생성
- [ ] Supabase 대시보드 로그인
- [ ] SQL Editor 열기
- [ ] `admin_users.sql` 파일의 모든 내용 복사
- [ ] SQL Editor에 붙여넣고 **Run** 클릭
- [ ] Table Editor에서 `admin_users` 테이블 보이는지 확인

### 2단계: Google OAuth 설정
- [ ] Supabase 대시보드 → Authentication → Providers
- [ ] Google 활성화
- [ ] 클라이언트 ID 입력: `1065487579327-vn4ig67b6kv9db0ltvqcs2niv22nrbhf.apps.googleusercontent.com`
- [ ] 클라이언트 보안 암호는 Supabase에서 자동으로 처리됨

### 3단계: 관리자 사용자 추가
- [ ] 앱에서 Google 로그인 시도 (아직 관리자가 아니므로 로그인 실패)
- [ ] Supabase → Authentication → Users에서 새 사용자 생성 확인
- [ ] 사용자의 UUID 복사
- [ ] Table Editor → admin_users → Insert row
  ```json
  {
    "id": "위에서 복사한 UUID",
    "email": "your-email@gmail.com",
    "full_name": "관리자 이름"
  }
  ```
- [ ] 저장
- [ ] 다시 앱에서 Google 로그인 시도 → 성공해야 함

## 🧪 테스트 체크리스트

### 관리자 로그인 성공 케이스
- [ ] http://localhost:5173/login 접속
- [ ] Google 로그인 버튼 보임
- [ ] Google 로그인 클릭
- [ ] admin_users에 등록된 이메일로 로그인
- [ ] /admin 페이지로 자동 리디렉트
- [ ] 관리자 대시보드 표시됨
- [ ] 프로필 사진 + 이름 표시됨
- [ ] 로그아웃 버튼 보임

### 관리자가 아닌 사용자 로그인 차단 케이스
- [ ] 구글 로그인 중 다른 이메일 계정으로 로그인
- [ ] admin_users에 등록되지 않은 이메일
- [ ] 로그인 페이지로 자동 리디렉트
- [ ] 에러 메시지 표시되지 않음 (자동 로그아웃)
- [ ] 콘솔에 "Admin check failed" 또는 유사 메시지 없음

### 세션 유지 테스트
- [ ] 관리자로 로그인
- [ ] 페이지 새로고침 (Ctrl+R)
- [ ] /admin 페이지 유지됨 (로그아웃되지 않음)
- [ ] 로그아웃 버튼 클릭
- [ ] /login 페이지로 리디렉트
- [ ] 페이지 새로고침
- [ ] /login 페이지 유지됨

## 🚀 배포 전 확인사항

- [ ] Google Cloud Console에서 리디렉션 URI 업데이트
  ```
  https://your-domain.com
  https://your-domain.com/admin
  ```
- [ ] Supabase 프로젝트 → Settings → API에서 프로덕션 URL 확인
- [ ] 환경 변수 업데이트 (.env.production 또는 배포 환경 변수)
- [ ] RLS 정책이 정말로 생성되었는지 다시 확인

## 🐛 트러블슈팅

### "Cannot GET /admin" 에러 또는 라우트 작동 안 함
```bash
# 개발 서버 재시작
npm run dev
```

### Supabase 연결 안 됨
```bash
# 개발자 도구 (F12) → Console에서 에러 확인
# 이 메시지가 보이면:
# "Uncaught (in promise) AbortError: signal is aborted"
# → Supabase 키 재확인, 서버 재시작
```

### admin_users 정책 에러 (403 Forbidden)
- Supabase → Table Editor → admin_users → Policy 탭
- 다음 정책이 활성화되었는지 확인:
  - ✅ `admin_users_read` (SELECT)
  - ✅ `admin_users_insert` (INSERT)
  - ✅ `admin_users_update` (UPDATE)
  - ✅ `admin_users_delete` (DELETE)

## 📞 문제가 발생했을 때 확인순서

1. 브라우저 콘솔 (F12) 에러 메시지 확인
2. Supabase 대시보드 → Logs 확인
3. admin_users 테이블이 정말 생성되었는지 확인
4. RLS 정책이 생성되었는지 확인
5. 사용자의 UUID가 admin_users.id와 정확히 일치하는지 확인

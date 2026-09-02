# Google OAuth 403 에러 해결 가이드

## 문제
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

이 에러는 Google이 localhost에서의 로그인을 차단했다는 뜻입니다.

---

## 해결 방법

### 1단계: Google Cloud Console 열기
https://console.cloud.google.com/

### 2단계: OAuth 2.0 클라이언트 ID 찾기
1. 좌측 메뉴 → **API 및 서비스**
2. **사용자 인증 정보** 클릭
3. **OAuth 2.0 클라이언트 ID** 섹션에서 클라이언트 ID 클릭
   - 클라이언트 ID: `1065487579327-vn4ig67b6kv9db0ltvqcs2niv22nrbhf.apps.googleusercontent.com`

### 3단계: 승인된 리디렉션 URI 추가
1. **승인된 리디렉션 URI** 섹션 찾기
2. **URI 추가** 클릭 (또는 기존 항목 수정)
3. 다음 주소들을 추가:
   ```
   http://localhost:5173
   http://localhost:5173/
   http://localhost:5173/login
   http://localhost:5173/admin
   ```

4. **저장** 클릭

### 4단계: 애플리케이션에서 Supabase도 추가
Supabase 대시보드 → Authentication → Providers → Google에서:

1. **Redirect URL for OAuth** 섹션의 URL 복사
   - 예: `https://ktejjjmsxkhdlguhlaqf.supabase.co/auth/v1/callback`

2. Google Cloud Console → 위의 **승인된 리디렉션 URI**에 추가:
   ```
   https://ktejjjmsxkhdlguhlaqf.supabase.co/auth/v1/callback
   ```

3. **저장** 클릭

---

## 결과

### 승인된 리디렉션 URI 최종 목록
```
http://localhost:5173
http://localhost:5173/
http://localhost:5173/login
http://localhost:5173/admin
https://ktejjjmsxkhdlguhlaqf.supabase.co/auth/v1/callback
```

---

## 테스트

1. 브라우저에서 http://localhost:5173/login 재접속
2. 개발자 도구 (F12) → Console 확인
3. "The given origin is not allowed" 에러 없어야 함
4. Google 로그인 버튼 클릭 → Google 로그인 창 열림 (정상)

---

## 캐시 초기화

만약 위 작업 후에도 에러가 계속 나면:

```bash
# 1. 브라우저 개발자 도구에서 LocalStorage 삭제
# F12 → Application → Local Storage → localhost:5173 → 모두 삭제

# 2. 개발 서버 재시작
npm run dev

# 3. 브라우저 새로고침 (Ctrl+Shift+R)
```

---

## 참고: Supabase 설정

Supabase에서 Google 제공자를 활성화할 때:

1. **클라이언트 ID**: 
   ```
   1065487579327-vn4ig67b6kv9db0ltvqcs2niv22nrbhf.apps.googleusercontent.com
   ```

2. **클라이언트 보안 암호**: 
   ```
   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
   ```

3. **Redirect URL** (읽기 전용):
   ```
   https://ktejjjmsxkhdlguhlaqf.supabase.co/auth/v1/callback
   ```
   이 URL을 Google Cloud Console의 승인된 리디렉션 URI에 추가해야 함.

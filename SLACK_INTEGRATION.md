# Slack Webhook 연동 가이드

## 1단계: Slack Webhook URL 생성

### 1-1. Slack 앱 생성
1. https://api.slack.com/apps 접속
2. **Create New App** 클릭
3. **From scratch** 선택
4. 앱 이름: `Booking Hub` 입력
5. 워크스페이스 선택
6. **Create App** 클릭

### 1-2. Incoming Webhooks 활성화
1. 왼쪽 메뉴 → **Incoming Webhooks** 클릭
2. **Activate Incoming Webhooks** 토글 ON
3. **Add New Webhook to Workspace** 클릭
4. 알림을 받을 채널 선택 (예: #bookings 또는 #general)
5. **Allow** 클릭
6. **Webhook URL** 복사 
   ```
   https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
   ```

---

## 2단계: .env 파일에 URL 추가

.env 파일 맨 마지막에 추가:

```
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

예시:
```
VITE_SUPABASE_URL=https://ktejjjmsxkhdlguhlaqf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
VITE_GOOGLE_CLIENT_ID=1065487...
VITE_GOOGLE_CLIENT_SECRET=GOCSPX...
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T123/B456/ABC789
```

---

## 3단계: 언제 알림이 발송되는가?

### 예약 추가 시
- Slack 메시지 예시:
  ```
  📝 새 예약이 추가되었습니다
  고객사: ABC회사
  서비스: 청소
  날짜: 2026-09-05
  시간: 14:00
  위치: 서울시 강남구 역삼동
  상태: 대기중
  ```

### 상태 변경 시
- Slack 메시지 예시:
  ```
  ✅ 예약 상태가 변경되었습니다
  고객사: ABC회사
  상태: 대기중 → 확정
  ```

---

## 4단계: 테스트

1. 브라우저에서 새 예약 추가
2. Slack 채널 확인 → 메시지 도착 확인
3. 예약 상태 변경 → 메시지 도착 확인

---

## 주의사항

⚠️ **Webhook URL은 민감한 정보입니다**
- 깃허브에 커밋하지 마세요
- .env는 .gitignore에 포함되어 있습니다
- 팀과 공유할 때는 URL을 공개하지 마세요

---

## 문제 해결

### Slack에 메시지가 안 옵니다
1. Webhook URL이 정확한지 확인
2. 채널이 존재하는지 확인
3. 앱이 채널에 추가되었는지 확인 (Slack 채널 설정 → 앱 탭)

### 403 Forbidden 에러
1. Webhook URL이 유효한지 확인
2. Slack 대시보드에서 URL 재생성

---

## 커스터마이징

메시지 형식을 변경하려면:
- `src/lib/slack.ts` 파일 수정
- Slack Block Kit 문서: https://api.slack.com/block-kit

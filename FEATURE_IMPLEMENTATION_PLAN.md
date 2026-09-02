# 5가지 기능 구현 계획

## 1. OpenStreetMap (Leaflet)
- Google Maps 대신 오픈소스 맵 사용
- 라이선스 무료, 개인정보 보호
- 설치: `npm install leaflet react-leaflet`
- 구현: 지도 모달 팝업

## 2. 주소 유효성 검사
- 주소 입력 시 자동 검증
- 빈 주소 방지
- 정규표현식으로 기본 검증
- 입력 필드 에러 표시

## 3. 위도 경도 조회
- Nominatim API (OpenStreetMap 무료 제오코딩)
- 주소 → 위도/경도 변환
- 위도/경도 → 주소 변환 (역제오코딩)
- 지도에 마커 표시

## 4. Slack Webhook 연동
- 예약 추가/수정/삭제 시 Slack 알림
- 포맷: 고객사, 서비스, 날짜/시간, 위치, 상태
- 환경변수: VITE_SLACK_WEBHOOK_URL

## 5. 날씨정보 연동
- Open-Meteo API (무료, 라이선스 불필요)
- 위도/경도로 날씨 조회
- 예약 위치의 예상 날씨 표시
- 아이콘: ☀️ 🌤️ 🌧️ ❄️

---

## 구현 순서

1. ✅ OpenStreetMap + Leaflet 설치 및 지도 모달 추가
2. ✅ 주소 유효성 검사 강화
3. ✅ Nominatim API로 위도/경도 조회
4. ✅ Slack Webhook 연동
5. ✅ Open-Meteo로 날씨 추가

---

## 필요한 라이브러리

```bash
npm install leaflet react-leaflet
```

---

## API 목록

| API | 용도 | 비용 | 제한 |
|-----|------|------|------|
| Nominatim | 주소 ↔ 좌표 | 무료 | 1초/요청 |
| Open-Meteo | 날씨 정보 | 무료 | 없음 |
| Slack | 웹훅 알림 | 무료 | 채널당 1개 |

---

## 예상 결과

```
예약 추가 시:
1. 주소 유효성 검사 ✓
2. Nominatim으로 좌표 조회 ✓
3. Open-Meteo로 날씨 조회 ✓
4. Slack에 알림 전송 ✓
5. 지도에서 위치 + 날씨 확인 가능 ✓
```

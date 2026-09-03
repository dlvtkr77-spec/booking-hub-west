// Google Calendar API를 통해 예약을 캘린더에 추가
export async function addEventToGoogleCalendar(booking: {
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string;
}) {
  try {
    // 날짜와 시간을 ISO 8601 형식으로 변환
    const [year, month, day] = booking.date.split('-');
    const [hour, minute] = booking.time.split(':');

    const startTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );

    // 끝나는 시간은 1시간 후로 설정
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `${booking.customer} - ${booking.service}`,
      description: `고객사: ${booking.customer}\n서비스: ${booking.service}\n위치: ${booking.address}`,
      location: booking.address,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Seoul',
      },
    };

    // 서버에 요청을 보내 Google Calendar에 이벤트 추가
    console.log('Sending event to Google Calendar API:', event);

    const response = await fetch('/api/calendar/add-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const responseData = await response.json();
    console.log('Google Calendar API response:', responseData);

    if (!response.ok) {
      console.error('Failed to add event to Google Calendar:', response.status, responseData);
      return false;
    }

    console.log('Event added to Google Calendar successfully:', responseData);
    return true;
  } catch (error) {
    console.error('Error in addEventToGoogleCalendar:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

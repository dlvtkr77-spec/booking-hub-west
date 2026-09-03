import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { summary, description, location, start, end } = req.body;

    console.log('Adding event to Google Calendar:', { summary, description, location, start, end });

    // 환경 변수에서 Google OAuth 토큰 가져오기
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    console.log('Environment check:', {
      refreshToken: refreshToken ? '✓' : '✗',
      clientId: clientId ? '✓' : '✗',
      clientSecret: clientSecret ? '✓' : '✗',
    });

    if (!refreshToken || !clientId || !clientSecret) {
      console.error('Missing credentials:', { refreshToken, clientId, clientSecret });
      return res.status(400).json({ error: 'Missing Google credentials' });
    }

    // Google OAuth2 클라이언트 설정
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3000/callback' // 리다이렉트 URI (사용되지 않음)
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Google Calendar API 초기화
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 캘린더에 이벤트 추가
    const event = {
      summary,
      description,
      location,
      start,
      end,
    };

    console.log('Calling Google Calendar API...');
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('Event created successfully:', response.data.id);
    return res.status(200).json({
      success: true,
      eventId: response.data.id,
      message: 'Event added to Google Calendar',
    });
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    return res.status(500).json({
      error: 'Failed to add event to Google Calendar',
      details: errorMessage,
    });
  }
}

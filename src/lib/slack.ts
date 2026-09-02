import { supabase } from './supabase';

// Slack 알림 전송 (Supabase를 통한 안전한 전송)
export async function sendSlackNotification(message: {
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: string;
}) {
  try {
    // Supabase RPC를 통해 서버에서 Slack에 알림 전송
    const { error } = await supabase.rpc('send_slack_notification', {
      p_customer: message.customer,
      p_service: message.service,
      p_date: message.date,
      p_time: message.time,
      p_address: message.address,
      p_status: message.status,
    });

    if (error) {
      console.error('Slack notification RPC error:', error);
    } else {
      console.log('Slack notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

/*
  Slack Notification RPC Function Setup Guide

  Step 1: Copy this entire SQL script
  Step 2: Go to Supabase Dashboard → SQL Editor
  Step 3: Create a new query and paste the full script
  Step 4: Replace SLACK_WEBHOOK_URL with your actual webhook URL from .env
  Step 5: Run the query
*/

-- Enable HTTP extension (if not already enabled)
create extension if not exists http with schema extensions;

-- Create the Slack notification RPC function
create or replace function send_slack_notification(
  p_customer text,
  p_service text,
  p_date text,
  p_time text,
  p_address text,
  p_status text
)
returns json as $$
declare
  v_webhook_url text := 'SLACK_WEBHOOK_URL'; -- Replace with your webhook URL from .env
  v_payload jsonb;
  v_response http_response;
begin
  -- Build Slack message payload
  v_payload := jsonb_build_object(
    'text', '📝 새 예약이 추가되었습니다',
    'blocks', jsonb_build_array(
      jsonb_build_object(
        'type', 'header',
        'text', jsonb_build_object(
          'type', 'plain_text',
          'text', '📝 새 예약 추가',
          'emoji', true
        )
      ),
      jsonb_build_object(
        'type', 'section',
        'fields', jsonb_build_array(
          jsonb_build_object('type', 'mrkdwn', 'text', '*고객사*' || chr(10) || p_customer),
          jsonb_build_object('type', 'mrkdwn', 'text', '*서비스*' || chr(10) || p_service),
          jsonb_build_object('type', 'mrkdwn', 'text', '*날짜*' || chr(10) || p_date),
          jsonb_build_object('type', 'mrkdwn', 'text', '*시간*' || chr(10) || p_time)
        )
      ),
      jsonb_build_object(
        'type', 'section',
        'fields', jsonb_build_array(
          jsonb_build_object('type', 'mrkdwn', 'text', '*위치*' || chr(10) || p_address),
          jsonb_build_object('type', 'mrkdwn', 'text', '*상태*' || chr(10) || case when p_status = 'pending' then '⏳ 대기중' else '✅ 확정' end)
        )
      ),
      jsonb_build_object('type', 'divider')
    )
  );

  -- Send HTTP POST request to Slack Webhook
  v_response := http_post(
    v_webhook_url,
    v_payload::text,
    'application/json'::text
  );

  -- Return response
  return jsonb_build_object(
    'success', v_response.status = 200,
    'status', v_response.status,
    'body', v_response.content
  );
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function send_slack_notification(text, text, text, text, text, text) to authenticated;

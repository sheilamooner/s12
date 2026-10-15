/**
 * Vercel Serverless Function
 * Handles Telegram notifications from setup.html securely
 * Secrets live in Vercel env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'method-not-allowed' });
  }

  // Guard: body may be undefined/unparseable (this crash caused FUNCTION_INVOCATION_FAILED)
  const body = req.body || {};
  const message = body.message;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ code: 'invalid-message' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('[telegram] Credentials not configured in environment');
    return res.status(500).json({ code: 'telegram-not-configured' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[telegram] API error:', response.status, error);
      return res.status(500).json({ code: 'telegram-send-failed' });
    }

    return res.status(200).json({ code: 'ok' });
  } catch (error) {
    console.error('[telegram] Request error:', error.message);
    return res.status(500).json({ code: 'error', message: error.message });
  }
}

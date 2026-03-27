#!/usr/bin/env bash
set -euo pipefail

: "${TELEGRAM_API_KEY:?Missing env var TELEGRAM_API_KEY}"
: "${TELEGRAM_CHAT_ID:?Missing env var TELEGRAM_CHAT_ID}"

TELEGRAM_TEXT="${TELEGRAM_TEXT:-Hello from Telegram bot.}"
# Recommended defaults:
# - Leave empty for plain text (no formatting headaches)
# - Or set to HTML if you want simple formatting
TELEGRAM_PARSE_MODE="${TELEGRAM_PARSE_MODE:-}"

if ! command -v jq >/dev/null 2>&1; then
  echo "[fail] jq not found (required by this script)."
  exit 1
fi

echo "== Telegram Send =="
echo "Time:    $(date -Iseconds)"
echo "Chat ID: ${TELEGRAM_CHAT_ID}"
echo "Mode:    ${TELEGRAM_PARSE_MODE:-plain}"
echo

# Build JSON safely with jq.
# If MarkdownV2 is selected, escape all reserved chars correctly.
if [[ "${TELEGRAM_PARSE_MODE}" == "MarkdownV2" ]]; then
  PAYLOAD="$(
    jq -n \
      --arg chat_id "${TELEGRAM_CHAT_ID}" \
      --arg text "${TELEGRAM_TEXT}" \
      'def esc_md: gsub("([_\\*\\[\\]\\(\\)~`>#+\\-=|{}.!\\\\])"; "\\\\\\1");
       {
         chat_id: ($chat_id|tonumber),
         text: ($text|esc_md),
         parse_mode: "MarkdownV2"
       }'
  )"
elif [[ -n "${TELEGRAM_PARSE_MODE}" ]]; then
  PAYLOAD="$(
    jq -n \
      --arg chat_id "${TELEGRAM_CHAT_ID}" \
      --arg text "${TELEGRAM_TEXT}" \
      --arg mode "${TELEGRAM_PARSE_MODE}" \
      '{ chat_id: ($chat_id|tonumber), text: $text, parse_mode: $mode }'
  )"
else
  # Plain text (no parse_mode) => most robust
  PAYLOAD="$(
    jq -n \
      --arg chat_id "${TELEGRAM_CHAT_ID}" \
      --arg text "${TELEGRAM_TEXT}" \
      '{ chat_id: ($chat_id|tonumber), text: $text }'
  )"
fi

HTTP_CODE="$(curl -sS -o /tmp/tg_body.$$ -w "%{http_code}" \
  -X POST "https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage" \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD")"

echo "HTTP: ${HTTP_CODE}"
echo
echo "== Response =="
cat /tmp/tg_body.$$
echo
rm -f /tmp/tg_body.$$

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  echo "✅ Message sent successfully."
else
  echo "❌ Telegram API returned HTTP ${HTTP_CODE}"
  exit 1
fi

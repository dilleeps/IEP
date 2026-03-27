#!/usr/bin/env bash
set -euo pipefail

: "${TELEGRAM_API_KEY:?Missing env var TELEGRAM_API_KEY}"

echo "== Telegram: waiting for a message mentioning the bot =="
echo "Tip: send '@botusername test' in the group"
echo

RESP="$(curl -sS "https://api.telegram.org/bot${TELEGRAM_API_KEY}/getUpdates?timeout=30")"

echo "== Raw response =="
echo "$RESP"
echo

echo "== Extracted chat IDs =="
echo "$RESP" | jq -r '
  .result[]
  | (
      .message.chat
      // .channel_post.chat
      // .my_chat_member.chat
    )
  | select(.id != null)
  | "\(.id)\t\(.type)\t\(.title // .username // "no-title")"
' | sort -u

echo
echo "== Chat ID only (copy-paste ready) =="
echo "$RESP" | jq -r '
  .result[]
  | (
      .message.chat
      // .channel_post.chat
      // .my_chat_member.chat
    )
  | select(.id != null)
  | .id
' | sort -u

#!/bin/bash
set -euo pipefail

# ===== CONFIG =====
TENANT_ID="${AZURE_TENANT_ID:?AZURE_TENANT_ID missing}"
CLIENT_ID="${AZURE_CLIENT_ID:?AZURE_CLIENT_ID missing}"
CLIENT_SECRET="${AZURE_CLIENT_SECRET:?AZURE_CLIENT_SECRET missing}"

FROM_USER="ask@askiep.com"          # organizer mailbox in your M365 tenant
TO_EMAIL="muthuishere@gmail.com"    # attendee

TIMEZONE="Asia/Kolkata"

# ISO 8601. Pick future times.
MEETING_START="2026-03-03T10:00:00"
MEETING_END="2026-03-03T10:30:00"
MEETING_SUBJECT="AskIEP - Graph Meeting Test"
# ==================

echo "Getting access token..."

TOKEN_JSON=$(curl -s -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=client_credentials" \
  "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token")

TOKEN=$(echo "$TOKEN_JSON" | jq -r .access_token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get token:"
  echo "$TOKEN_JSON" | jq
  exit 1
fi

echo "Token acquired."

echo
echo "1) Sending email..."

MAIL_RESP=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST \
  "https://graph.microsoft.com/v1.0/users/$FROM_USER/sendMail" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": {
      \"subject\": \"Graph API Test Email\",
      \"body\": {
        \"contentType\": \"HTML\",
        \"content\": \"<h2>Hello from Azure Graph</h2><p>If you see this, your app-only flow works.</p>\"
      },
      \"toRecipients\": [
        { \"emailAddress\": { \"address\": \"$TO_EMAIL\" } }
      ]
    },
    \"saveToSentItems\": true
  }")

echo "$MAIL_RESP"

echo
echo "2) Creating calendar meeting invite (Teams meeting + attendee)..."

EVENT_RESP=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST \
  "https://graph.microsoft.com/v1.0/users/$FROM_USER/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subject\": \"$MEETING_SUBJECT\",
    \"body\": {
      \"contentType\": \"HTML\",
      \"content\": \"<p>Agenda: quick test</p><p>This meeting was created via Microsoft Graph.</p>\"
    },
    \"start\": { \"dateTime\": \"$MEETING_START\", \"timeZone\": \"$TIMEZONE\" },
    \"end\":   { \"dateTime\": \"$MEETING_END\",   \"timeZone\": \"$TIMEZONE\" },
    \"attendees\": [
      { \"emailAddress\": { \"address\": \"$TO_EMAIL\" }, \"type\": \"required\" }
    ],
    \"isOnlineMeeting\": true,
    \"onlineMeetingProvider\": \"teamsForBusiness\"
  }")

echo "$EVENT_RESP"

# Optional: extract meeting join URL if present
JOIN_URL=$(echo "$EVENT_RESP" | sed -n '1,/HTTP_STATUS/p' | jq -r '.onlineMeeting.joinUrl // empty' 2>/dev/null || true)
if [ -n "$JOIN_URL" ]; then
  echo
  echo "Teams Join URL: $JOIN_URL"
fi

echo
echo "Done."
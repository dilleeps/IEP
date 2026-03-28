# Lead Module

This module handles visitor/lead tracking with reCAPTCHA verification.

## Features

- ✅ Public lead submission with reCAPTCHA v3 protection
- ✅ Automatic IP address and user agent tracking
- ✅ Admin-only lead listing and statistics
- ✅ CSV export functionality
- ✅ Configurable reCAPTCHA score threshold

## Environment Variables

Add these to your `.env` file:

```bash
# reCAPTCHA Configuration
RECAPTCHA_SECRET=your_recaptcha_secret_key
RECAPTCHA_MIN_SCORE=0.5  # Minimum score for v3 (0.0 to 1.0)
```

## API Endpoints

### Public Endpoints

#### Create Lead (POST /api/v1/leads)
Submit a new lead with reCAPTCHA verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "recaptchaToken": "token_from_frontend",
  "recaptchaAction": "submit_lead"  // Optional, for v3
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Lead recorded successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "captchaScore": 0.9,
    "captchaAction": "submit_lead",
    "createdAt": "2026-01-11T10:00:00.000Z"
  }
}
```

### Admin Endpoints (Requires Authentication + ADMIN Role)

#### List Leads (GET /api/v1/leads)
Get paginated list of leads.

**Query Parameters:**
- `limit` (optional, default: 50, max: 200)
- `offset` (optional, default: 0)
- `format` (optional: 'json' | 'csv', default: 'json')

**JSON Response:**
```json
{
  "leads": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

**CSV Export:**
Add `?format=csv` to download as CSV file.

#### Get Lead Statistics (GET /api/v1/leads/stats)
Get lead count and recent submissions.

**Response:**
```json
{
  "totalLeads": 100,
  "recentCount": 10,
  "recentLeads": [...]
}
```

## Database Schema

The `leads` table includes:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Lead email address |
| ip | VARCHAR(100) | IP address of submission |
| user_agent | TEXT | Browser user agent |
| captcha_score | DECIMAL(3,2) | reCAPTCHA v3 score (0.0-1.0) |
| captcha_action | VARCHAR(100) | reCAPTCHA v3 action name |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Frontend Integration

### reCAPTCHA v3 Example

```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

<script>
async function submitLead(email) {
  const token = await grecaptcha.execute('YOUR_SITE_KEY', {
    action: 'submit_lead'
  });
  
  const response = await fetch('/api/v1/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      recaptchaToken: token,
      recaptchaAction: 'submit_lead'
    })
  });
  
  return await response.json();
}
</script>
```

## Running Migrations

To create the leads table:

```bash
npm run migrate
```

## Testing

The module includes:
- Rate limiting on lead creation
- Input validation with Zod
- SQL injection protection via Sequelize ORM
- Error handling and logging

## Future Enhancements

- [ ] Email notifications on new leads
- [ ] Telegram notifications
- [ ] Lead deduplication logic
- [ ] Lead scoring/qualification
- [ ] Integration with CRM systems

# AskIEP API Documentation

## 📚 Interactive API Documentation

Access the full interactive API documentation with Swagger UI:

**URL:** http://localhost:3000/api-docs

Or run: `npm run docs` to automatically open the API docs in your browser.

## 🔑 Authentication

Most endpoints require authentication using JWT Bearer tokens. To test authenticated endpoints:

1. **Login** using the `/api/v1/auth/login` endpoint with demo credentials:
   - Email: `parent@askiep.com`
   - Password: `Demo123`

2. **Copy the `accessToken`** from the login response

3. **Click the "Authorize" button** in Swagger UI (top right)

4. **Enter**: `Bearer <your-access-token>` and click "Authorize"

5. You can now test all protected endpoints!

## 👥 Demo User Accounts

After running `npm run db:seed`, you can use these accounts:

| Role | Email | Password | Status |
|------|-------|----------|--------|
| PARENT | parent@askiep.com | Demo123 | active |
| ADVOCATE | advocate@askiep.com | Demo123 | pending |
| TEACHER_THERAPIST | teacher@askiep.com | Demo123 | pending |
| ADMIN | admin@askiep.com | Demo123 | active |
| SUPPORT | support@askiep.com | Demo123 | active |

## 🎯 Quick Start Testing

1. Start the server: `npm run dev`
2. Open Swagger UI: `npm run docs` or visit http://localhost:3000/api-docs
3. Test public endpoints (no auth needed):
   - `GET /health` - Check server health
   - `POST /api/v1/auth/register` - Register a new user
   - `POST /api/v1/auth/login` - Login
   - `GET /api/v1/config` - Get system configuration

4. Authenticate:
   - Login with `parent@askiep.com` / `Demo123`
   - Copy the `accessToken`
   - Click "Authorize" button and paste: `Bearer <token>`

5. Test protected endpoints:
   - `GET /api/v1/auth/me` - Get your profile
   - `GET /api/v1/children` - List children
   - `GET /api/v1/goals` - List goals
   - `GET /api/v1/dashboard` - Get dashboard stats

## 🔐 Role-Based Access

Different roles have different permissions:

- **PARENT**: Full access to their own children, goals, and data
- **ADVOCATE**: Access to assigned cases and advocacy resources
- **TEACHER_THERAPIST**: Access to assigned students and educational data
- **ADMIN**: Full system access including user management
- **SUPPORT**: Customer support access

## 📊 API Endpoints Summary

### Authentication (Public)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token

### Authentication (Protected)
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/change-password` - Change password

### Children (Protected)
- `GET /api/v1/children` - List children
- `POST /api/v1/children` - Create child profile
- `GET /api/v1/children/:id` - Get child details
- `PATCH /api/v1/children/:id` - Update child
- `DELETE /api/v1/children/:id` - Delete child (soft delete)

### Goals (Protected)
- `GET /api/v1/goals` - List goals
- `POST /api/v1/goals` - Create goal
- `GET /api/v1/goals/:id` - Get goal
- `PATCH /api/v1/goals/:id` - Update goal
- `DELETE /api/v1/goals/:id` - Delete goal

### Communications (Protected)
- `GET /api/v1/communications` - List communications
- `POST /api/v1/communications` - Log communication
- `GET /api/v1/communications/:id` - Get communication
- `PATCH /api/v1/communications/:id` - Update communication
- `DELETE /api/v1/communications/:id` - Delete communication

### Behaviors (Protected)
- `GET /api/v1/behaviors` - List behavior incidents
- `POST /api/v1/behaviors` - Create behavior log

### Letters (Protected)
- `GET /api/v1/letters` - List generated letters
- `POST /api/v1/letters` - Generate new letter

### Resources (Protected)
- `GET /api/v1/resources` - Get educational resources

### Advocacy (Protected)
- `GET /api/v1/advocacy` - Get advocacy guides

### Compliance (Protected)
- `GET /api/v1/compliance` - Get compliance status

### Dashboard (Protected)
- `GET /api/v1/dashboard` - Get dashboard stats

### Preferences (Protected)
- `GET /api/v1/settings/preferences` - Get preferences
- `PUT /api/v1/settings/preferences` - Update preferences

### AI Conversations (Protected)
- `GET /api/v1/ai/conversations` - List conversations
- `POST /api/v1/ai/conversations` - Create conversation
- `GET /api/v1/ai/conversations/:id` - Get conversation
- `POST /api/v1/ai/conversations/:id/messages` - Send message

### Smart Prompts (Protected)
- `GET /api/v1/smart-prompts` - Get contextual prompts

### Configuration (Public/Protected)
- `GET /api/v1/config` - Get public config (no auth)
- `GET /api/v1/admin/config` - Get admin config (ADMIN only)
- `POST /api/v1/admin/config` - Create config (ADMIN only)

### Admin - User Management (ADMIN only)
- `GET /api/v1/admin/users` - List all users
- `POST /api/v1/admin/users/:id/approve` - Approve user
- `POST /api/v1/admin/users/:id/suspend` - Suspend user

## 🧪 Testing Workflow

### 1. Test Public Endpoints (No Auth)
```bash
# Health check
curl http://localhost:3000/health

# Get system configuration
curl http://localhost:3000/api/v1/config
```

### 2. Login & Get Token
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@askiep.com","password":"Demo123"}'

# Save the accessToken from response
```

### 3. Test Protected Endpoints
```bash
# Get current user profile
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# List children
curl http://localhost:3000/api/v1/children \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get dashboard
curl http://localhost:3000/api/v1/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🎨 Swagger UI Features

- **Try it out**: Test endpoints directly from the browser
- **Request/Response examples**: See sample payloads
- **Schema documentation**: View all data models
- **Authentication**: Built-in JWT token management
- **Response codes**: See all possible responses
- **Real-time testing**: Execute requests and see live responses

## 📝 Response Formats

All responses follow consistent patterns:

**Success (200/201):**
```json
{
  "data": {...},
  "message": "Success"
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2026-01-10T08:00:00.000Z"
}
```

## 🛡️ Security

- All passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 15 minutes (access) / 7 days (refresh)
- Rate limiting applied to auth endpoints
- CORS enabled for trusted origins
- Request context tracking for audit logs

## 📦 Need Help?

- View full API docs: http://localhost:3000/api-docs
- Check PRD: `docs/prd.md`
- View API designs: `docs/domains/*/api.md`
- Contact: support@askiep.com

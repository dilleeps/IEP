import express from "express";
import cors from "cors";
import expressWinston from "express-winston";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { logger } from "./config/logger.js";
import { env } from "./config/env.js";
import { requestContext } from "./middleware/requestContext.js";
import { healthRouter } from "./health/health.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticate } from "./middleware/authenticate.js";
import { requireRole } from "./middleware/authorize.js";
import { STANDARD_PROTECTED_ROLES } from "./middleware/roles.js";
import { apiRateLimit } from "./middleware/rateLimit.js";
import { auditDataAccess } from "./middleware/auditDataAccess.js";

// Domain routers
import { authRouter } from "./modules/auth/auth.routes.js";
import { leadRouter } from "./modules/lead/lead.routes.js";
import { childRouter } from "./modules/child/child.routes.js";
import { documentRouter } from './modules/document/document.routes.js';
import goalRoutes from "./modules/goal/goal.routes.js";
import progressEntryRoutes from "./modules/goal/progress-entry.routes.js";
import serviceRoutes from "./modules/service/service.routes.js";
import complianceRoutes from "./modules/compliance/compliance.routes.js";
import communicationRoutes from "./modules/communication/communication.routes.js";
import behaviorRoutes from "./modules/behavior/behavior.routes.js";
import letterRoutes from "./modules/letter/letter.routes.js";
import advocacyRoutes from "./modules/advocacy/advocacy.routes.js";
import legalSupportRoutes from "./modules/agent/legal-support/index.js";
import resourceRoutes from "./modules/resource/resource.routes.js";
import preferenceRoutes from "./modules/preference/preference.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import conversationRoutes from "./modules/ai/conversation/conversation.routes.js";
import smartPromptsRoutes from "./modules/smart-prompts/smart-prompts.routes.js";
import publicConfigRoutes from "./modules/config/public/config.routes.js";
import adminConfigRoutes from "./modules/config/admin/admin-config.routes.js";
import adminUsersRoutes from "./modules/admin/users/admin-users.routes.js";
import publicPlansRoutes from "./modules/plans/plan.public.routes.js";
import adminPlansRoutes from "./modules/plans/plan.admin.routes.js";
import userManagementRoutes from "./modules/admin/userManagement.routes.js";
import adminAnalyticsRoutes from "./modules/admin/analytics/admin-analytics.routes.js";
import storageRoutes from "./modules/storage/storage.routes.js";
import { consentRouter } from "./modules/consent/consent.routes.js";
import counselorRoutes from './modules/counselor/counselor.routes.js';
import consultationRoutes from './modules/consultation/consultation.routes.js';
import stripeWebhookRoutes from './modules/plans/stripe-webhook.routes.js';
import { supportRouter } from './modules/support/support.routes.js';

export const app = express();

// Trust proxy - Trust only the first proxy (Cloud Run/GCP Load Balancer)
// Using number 1 instead of true to prevent IP spoofing attacks
// See: https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);

// CORS - Allow specific origins (wildcard '*' cannot be used with credentials)
const allowedOrigins = [
  'https://dev.askiep.com',
  'https://app.askiep.com',
  'https://prod.askiep.com',
  'https://console.askiep.com',
  'https://askiep.com',
  'https://www.askiep.com',
  'https://iep-web-production-4bcwtuqyca-uc.a.run.app',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Stripe webhook needs raw body for signature verification (must be before express.json)
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

// Global middleware
app.use(express.json({ limit: '25mb' })); // Support file uploads
app.use(apiRateLimit); // Rate limiting

// Request logs (optional, controlled by ENABLE_HTTP_LOGGING env var)
if (env.ENABLE_HTTP_LOGGING) {
  app.use(
    expressWinston.logger({
      winstonInstance: logger,
      meta: true,
      msg: "HTTP {{req.method}} {{req.url}}",
      expressFormat: false,
      colorize: false,
    }),
  );
}

app.use(requestContext);

// Public routes
app.use("/health", healthRouter);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AskIEP API Docs',
  customfavIcon: '/favicon.ico'
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
// API v1 routes
const v1Router = express.Router();

// Auth routes (public)
v1Router.use("/auth", authRouter);

// Lead routes (public + admin)
v1Router.use("/leads", leadRouter);

// Protected routes (require authentication)
v1Router.use("/children", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "child", piiFields: ["name", "dateOfBirth", "disabilities"] }), childRouter);
v1Router.use("/iep", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "document", piiFields: ["fileName", "metadata", "extraction"] }), documentRouter);
v1Router.use("/goals", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "goal", piiFields: ["goalText", "notes"] }), goalRoutes);
v1Router.use("/progress-entries", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "progress_entry", piiFields: ["currentLevel", "notes", "evidence"] }), progressEntryRoutes);
v1Router.use("/services", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "service", piiFields: ["notes", "provider"] }), serviceRoutes);
v1Router.use("/compliance", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "compliance_log", piiFields: ["notes", "attachments"] }), complianceRoutes);
v1Router.use("/communications", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "communication_log", piiFields: ["summary", "attachments"] }), communicationRoutes);
v1Router.use("/behaviors", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "behavior_log", piiFields: ["behavior", "notes"] }), behaviorRoutes);
v1Router.use("/letters", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "letter", piiFields: ["subject", "content"] }), letterRoutes);
v1Router.use("/advocacy", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "advocacy_insight", piiFields: ["title", "description", "actionItems"] }), advocacyRoutes);
v1Router.use("/agent/legal-support", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "legal_support_session", piiFields: ["messages"] }), legalSupportRoutes);
v1Router.use("/resources", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "resource", piiFields: [] }), resourceRoutes);
v1Router.use("/settings/preferences", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "preference", piiFields: ["notificationPreferences", "displayPreferences"] }), preferenceRoutes);
v1Router.use("/dashboard", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "dashboard", piiFields: [] }), dashboardRoutes);
v1Router.use("/ai/conversations", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "ai_conversation", piiFields: ["messages"] }), conversationRoutes);
v1Router.use("/smart-prompts", authenticate, requireRole(STANDARD_PROTECTED_ROLES), auditDataAccess({ entityType: "smart_prompt", piiFields: ["title", "body"] }), smartPromptsRoutes);
v1Router.use("/config", authenticate, requireRole(STANDARD_PROTECTED_ROLES), publicConfigRoutes);
v1Router.use("/storage", authenticate, requireRole(STANDARD_PROTECTED_ROLES), storageRoutes); // proxy for GCS downloads
v1Router.use("/consents", authenticate, requireRole(STANDARD_PROTECTED_ROLES), consentRouter);
v1Router.use('/counselor', counselorRoutes);
v1Router.use('/consultations', consultationRoutes);

// Support ticket (authenticated but any role)
v1Router.use("/support", authenticate, supportRouter);

// Public plans (no auth — for login page)
v1Router.use("/plans", publicPlansRoutes);

// Admin routes (require admin role)
v1Router.use("/admin/config", adminConfigRoutes); // Auth + RBAC inside routes
v1Router.use("/admin/users", adminUsersRoutes); // Auth + RBAC inside routes
v1Router.use("/admin/plans", adminPlansRoutes); // Auth + RBAC inside routes
v1Router.use("/admin/user-management", userManagementRoutes); // Auth + RBAC inside routes - approval workflow
v1Router.use("/admin/analytics", adminAnalyticsRoutes); // Auth + RBAC inside routes

app.use("/api/v1", v1Router);

// Error handler (must be last)
app.use(errorHandler);

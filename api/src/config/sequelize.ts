import { readFileSync } from "node:fs";
import { Sequelize } from "sequelize";
import { appenv } from "./appenv.js";
import { logger } from "./logger.js";

const isTest = appenv.get("NODE_ENV") === "test";

// Module-scoped sequelize instance (initialized lazily)
let _sequelize: Sequelize | null = null;

/**
 * Get the sequelize instance
 * Throws error if not initialized
 */
export function getSequelize(): Sequelize {
  if (!_sequelize) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return _sequelize;
}

/**
 * Create GCP Cloud SQL connection (Unix socket)
 */
function getGcpCloudSqlConnection(): Sequelize {
  const cloudSqlConnectionName = appenv.get("CLOUDSQL_CONNECTION_NAME");
  if (!cloudSqlConnectionName) {
    throw new Error("CLOUDSQL_CONNECTION_NAME required for Cloud Run");
  }

  const host = `/cloudsql/${cloudSqlConnectionName}`;
  logger.info(`🔌 Using Cloud SQL Unix socket: ${host}`);

  if (appenv.get("DATABASE_URL")) {
    return new Sequelize(appenv.get("DATABASE_URL")!, {
      logging: false,
      dialect: "postgres",
      dialectOptions: {},
    });
  }

  return new Sequelize(
    appenv.get("POSTGRES_DB"),
    appenv.get("POSTGRES_USER"),
    appenv.get("POSTGRES_PASSWORD"),
    {
      host,
      port: undefined,
      dialect: "postgres",
      logging: isTest ? false : false,
      dialectOptions: {},
      define: {
        schema: "public",
      },
    }
  );
}

/**
 * Create secure SQL connection (with SSL certificates)
 */
function getSecureSqlConnection(): Sequelize {
  const host = appenv.get("POSTGRES_HOST") || "localhost";
  const port = appenv.getAsNumber("POSTGRES_PORT") ?? 5432;

  const caCertPath = appenv.getAsFilePath("PG_CA_CERT_PATH");
  const clientCertPath = appenv.getAsFilePath("PG_CLIENT_CERT_PATH");
  const keyPath = appenv.getAsFilePath("PG_KEY_CERT_PATH");

  if (!caCertPath) {
    throw new Error("PG_CA_CERT_PATH required for SSL connection");
  }

  const dialectOptions = {
    ssl: {
      ca: readFileSync(caCertPath).toString(),
      cert: clientCertPath ? readFileSync(clientCertPath).toString() : undefined,
      key: keyPath ? readFileSync(keyPath).toString() : undefined,
      rejectUnauthorized: true,
    },
  };

  logger.info(`🔒 Using SSL connection to ${host}:${port}`);

  // if (appenv.get("DATABASE_URL")) {
  //   return new Sequelize(appenv.get("DATABASE_URL")!, {
  //     logging: false,
  //     dialect: "postgres",
  //     dialectOptions,
  //   });
  // }

  return new Sequelize(
    appenv.get("POSTGRES_DB"),
    appenv.get("POSTGRES_USER"),
    appenv.get("POSTGRES_PASSWORD"),
    {
      host,
      port,
      dialect: "postgres",
      logging: isTest ? false : false,
      dialectOptions,
    }
  );
}

/**
 * Create plain SQL connection (no SSL)
 */
function getPlainSqlConnection(): Sequelize {
  const host = appenv.get("POSTGRES_HOST") || "localhost";
  const port = appenv.getAsNumber("POSTGRES_PORT") ?? 5432;

  logger.info(`🔌 Using plain connection to ${host}:${port}`);

  // if (appenv.get("DATABASE_URL")) {
  //   return new Sequelize(appenv.get("DATABASE_URL")!, {
  //     logging: false,
  //     dialect: "postgres",
  //     dialectOptions: {},
  //   });
  // }

  return new Sequelize(
    appenv.get("POSTGRES_DB"),
    appenv.get("POSTGRES_USER"),
    appenv.get("POSTGRES_PASSWORD"),
    {
      host,
      port,
      dialect: "postgres",
      logging: isTest ? false : false,
      dialectOptions: {},
      define: {
        schema: "public",
      },
    }
  );
}

/**
 * Initialize database connection
 */
export async function initDb(): Promise<void> {
  if (_sequelize) {
    return; // Already initialized
  }

  // Determine connection type based on environment
  const isCloudRun = !!appenv.get("K_SERVICE");
  const hasSslCerts = !!appenv.getAsFilePath("PG_CA_CERT_PATH");

  if (isCloudRun) {
    _sequelize = getGcpCloudSqlConnection();
  } else if (hasSslCerts) {
    _sequelize = getSecureSqlConnection();
  } else {
    _sequelize = getPlainSqlConnection();
  }

  const dbConfig = {
    host: appenv.get("POSTGRES_HOST"),
    port: appenv.getAsNumber("POSTGRES_PORT"),
    db: appenv.get("POSTGRES_DB"),
    user: appenv.get("POSTGRES_USER"),
  };
  logger.info("🔧 Database config", dbConfig);

  logger.info("🔌 Connecting to database...");
  await _sequelize.authenticate();
  logger.info("✅ Database connected successfully");


  // Initialize all models after database connection is established
  logger.info("📦 Initializing models...");
  await initAllModels(_sequelize);
  logger.info("✅ Models initialized successfully");

}

/**
 * Initialize all domain models
 */
async function initAllModels(sequelize: Sequelize): Promise<void> {
  // Auth domain
  const { initUserModel } = await import("../auth/user.model.js");
  
  // Lead domain
  const { initLeadModel } = await import("../lead/lead.model.js");
  
  // Child domain
  const { initChildProfileModel } = await import("../child/child.model.js");
  
  // Document domain
  const { initIepDocumentModel } = await import("../document/document.model.js");
  const { initIepAnalysisModel } = await import("../document/analysis.model.js");
  const { initExtractionCorrectionModel } = await import("../document/extraction-corrections.model.js");
  
  // Goal domain
  const { initGoalProgressModel } = await import("../goal/goal.model.js");
  const { initProgressEntryModel } = await import("../goal/progress-entries.model.js");
  
  // Service domain
  const { initServiceModel, initServiceLogModel } = await import("../service/service.model.js");
  
  // Compliance domain
  const { initComplianceLogModel } = await import("../compliance/compliance.model.js");
  const { initComplianceSummaryModel } = await import("../compliance/complianceSummary.model.js");
  
  // Communication domain
  const { initCommunicationLogModel } = await import("../communication/communication.model.js");
  
  // Behavior domain
  const { initBehaviorLogModel } = await import("../behavior/behavior.model.js");
  
  // Letter domain
  const { initLetterDraftModel } = await import("../letter/letter.model.js");
  const { initLetterTemplateModel } = await import("../letter/template.model.js");
  
  // Advocacy domain
  const { initAdvocacyInsightModel } = await import("../advocacy/advocacy.model.js");
  const { initSmartPromptModel } = await import("../advocacy/smartPrompt.model.js");
  
  // Resource domain
  const { initResourceModel } = await import("../resource/resource.model.js");
  
  // Preference domain
  const { initUserPreferenceModel } = await import("../preference/preference.model.js");
  
  // Audit domain
  const { initAuditLogModel } = await import("../audit/audit.model.js");
  
  // Consent domain
  const { initUserConsentModel } = await import("../consent/consent.model.js");
  
  // AI domain
  const { initAiConversationModel } = await import("../ai/conversation.model.js");
  const { initVectorEmbeddingModel } = await import("../ai/vectorEmbedding.model.js");
  
  // Config domain
  const { initSystemConfigurationModel } = await import("../config/config.model.js");
  
  // Plans domain
  const { initSubscriptionPlanModel } = await import("../plans/plan.model.js");
  
  // Admin domain
  const { initUserRegistrationRequestModel } = await import("../admin/userRegistrationRequest.model.js");

  // Counselor domain
  const {
    initCounselorAppointmentModel,
    initCounselorServiceModel,
    initCounselorAvailabilityWindowModel,
    initCounselorProfileModel,
    initCounselorGoogleTokenModel,
    initCounselorServiceCategoryModel,
    initCounselorServiceTemplateModel,
  } = await import('../counselor/counselor.model.js');

  // Expert consultation domain
  const {
    initExpertConsultationSlotModel,
    initExpertConsultationModel,
  } = await import('../consultation/consultation.model.js');

  // Initialize all models
  initUserModel(sequelize);
  initLeadModel(sequelize);
  initChildProfileModel(sequelize);
  initIepDocumentModel(sequelize);
  initIepAnalysisModel(sequelize);
  initExtractionCorrectionModel(sequelize);
  initGoalProgressModel(sequelize);
  initProgressEntryModel(sequelize);
  initServiceModel(sequelize);
  initServiceLogModel(sequelize);
  initComplianceLogModel(sequelize);
  initComplianceSummaryModel(sequelize);
  initCommunicationLogModel(sequelize);
  initBehaviorLogModel(sequelize);
  initLetterDraftModel(sequelize);
  initLetterTemplateModel(sequelize);
  initAdvocacyInsightModel(sequelize);
  initSmartPromptModel(sequelize);
  initResourceModel(sequelize);
  initUserPreferenceModel(sequelize);
  initAuditLogModel(sequelize);
  initUserConsentModel(sequelize);
  initAiConversationModel(sequelize);
  initVectorEmbeddingModel(sequelize);
  initSystemConfigurationModel(sequelize);
  initSubscriptionPlanModel(sequelize);
  initUserRegistrationRequestModel(sequelize);
  initCounselorServiceModel(sequelize);
  initCounselorAvailabilityWindowModel(sequelize);
  initCounselorProfileModel(sequelize);
  initCounselorGoogleTokenModel(sequelize);
  initCounselorAppointmentModel(sequelize);
  initCounselorServiceCategoryModel(sequelize);
  initCounselorServiceTemplateModel(sequelize);
  initExpertConsultationSlotModel(sequelize);
  initExpertConsultationModel(sequelize);

  // Set up model associations
  await setupAssociations();
}

/**
 * Set up all model relationships
 */
async function setupAssociations(): Promise<void> {
  // Import all models
  const { User } = await import("../auth/user.model.js");
  const { ChildProfile } = await import("../child/child.model.js");
  const { IepDocument } = await import("../document/document.model.js");
  const { IepAnalysis } = await import("../document/analysis.model.js");
  const { GoalProgress } = await import("../goal/goal.model.js");
  const { ComplianceLog } = await import("../compliance/compliance.model.js");
  const { ComplianceSummary } = await import("../compliance/complianceSummary.model.js");
  const { CommunicationLog } = await import("../communication/communication.model.js");
  const { BehaviorLog } = await import("../behavior/behavior.model.js");
  const { LetterDraft } = await import("../letter/letter.model.js");
  const { LetterTemplate } = await import("../letter/template.model.js");
  const { AdvocacyInsight } = await import("../advocacy/advocacy.model.js");
  const { SmartPrompt } = await import("../advocacy/smartPrompt.model.js");
  const { Resource } = await import("../resource/resource.model.js");
  const { UserPreference } = await import("../preference/preference.model.js");
  const { AuditLog } = await import("../audit/audit.model.js");
  const { UserConsent } = await import("../consent/consent.model.js");
  const { AiConversation } = await import("../ai/conversation.model.js");
  const {
    CounselorAppointment,
    CounselorService,
    CounselorAvailabilityWindow,
    CounselorProfile,
    CounselorGoogleToken,
  } = await import('../counselor/counselor.model.js');
  const {
    ExpertConsultation,
    ExpertConsultationSlot,
  } = await import('../consultation/consultation.model.js');

  // User associations
  User.hasMany(ChildProfile, { foreignKey: 'userId', as: 'children' });
  User.hasMany(IepDocument, { foreignKey: 'userId', as: 'documents' });
  User.hasMany(GoalProgress, { foreignKey: 'userId', as: 'goals' });
  User.hasMany(ComplianceLog, { foreignKey: 'userId', as: 'complianceLogs' });
  User.hasMany(CommunicationLog, { foreignKey: 'userId', as: 'communications' });
  User.hasMany(BehaviorLog, { foreignKey: 'userId', as: 'behaviors' });
  User.hasMany(LetterDraft, { foreignKey: 'userId', as: 'letters' });
  User.hasMany(AdvocacyInsight, { foreignKey: 'userId', as: 'insights' });
  User.hasMany(SmartPrompt, { foreignKey: 'userId', as: 'prompts' });
  User.hasOne(UserPreference, { foreignKey: 'userId', as: 'preferences' });
  User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
  User.hasMany(UserConsent, { foreignKey: 'userId', as: 'consents' });
  User.hasMany(AiConversation, { foreignKey: 'userId', as: 'conversations' });
  User.hasMany(CounselorService, { foreignKey: 'counselorId', as: 'counselorServices' });
  User.hasMany(CounselorAvailabilityWindow, { foreignKey: 'counselorId', as: 'counselorAvailabilityWindows' });
  User.hasOne(CounselorProfile, { foreignKey: 'userId', as: 'counselorProfile' });
  User.hasOne(CounselorGoogleToken, { foreignKey: 'userId', as: 'counselorGoogleToken' });
  User.hasMany(CounselorAppointment, { foreignKey: 'counselorId', as: 'counselorAppointments' });
  User.hasMany(CounselorAppointment, { foreignKey: 'parentUserId', as: 'parentCounselorAppointments' });

  // ChildProfile associations
  ChildProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ChildProfile.hasMany(IepDocument, { foreignKey: 'childId', as: 'documents' });
  ChildProfile.hasMany(GoalProgress, { foreignKey: 'childId', as: 'goals' });
  ChildProfile.hasMany(ComplianceLog, { foreignKey: 'childId', as: 'complianceLogs' });
  ChildProfile.hasMany(ComplianceSummary, { foreignKey: 'childId', as: 'complianceSummaries' });
  ChildProfile.hasMany(CommunicationLog, { foreignKey: 'childId', as: 'communications' });
  ChildProfile.hasMany(BehaviorLog, { foreignKey: 'childId', as: 'behaviors' });
  ChildProfile.hasMany(LetterDraft, { foreignKey: 'childId', as: 'letters' });
  ChildProfile.hasMany(AdvocacyInsight, { foreignKey: 'childId', as: 'insights' });
  ChildProfile.hasMany(SmartPrompt, { foreignKey: 'childId', as: 'prompts' });
  ChildProfile.hasMany(AiConversation, { foreignKey: 'childId', as: 'conversations' });

  // IepDocument associations
  IepDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  IepDocument.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });
  IepDocument.hasOne(IepAnalysis, { foreignKey: 'documentId', as: 'analysis' });

  // IepAnalysis associations
  IepAnalysis.belongsTo(IepDocument, { foreignKey: 'documentId', as: 'document' });

  // GoalProgress associations
  GoalProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  GoalProgress.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });
  GoalProgress.belongsTo(IepDocument, { foreignKey: 'documentId', as: 'document' });
  IepDocument.hasMany(GoalProgress, { foreignKey: 'documentId', as: 'goals' });

  // ComplianceLog associations
  ComplianceLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ComplianceLog.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

  // ComplianceSummary associations
  ComplianceSummary.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ComplianceSummary.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

  // CommunicationLog associations
  CommunicationLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  CommunicationLog.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

  // BehaviorLog associations
  BehaviorLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  BehaviorLog.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

  // LetterDraft associations
  LetterDraft.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  LetterDraft.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

  // LetterTemplate associations
  LetterTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // AdvocacyInsight associations
  AdvocacyInsight.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  AdvocacyInsight.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

  // SmartPrompt associations
  SmartPrompt.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  SmartPrompt.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

  // Resource associations
  // Note: resources table does not have a user FK column in current migrations.
  // Avoid associating to User by non-existent `created_by` column to prevent queries
  // that reference missing columns. If a creator FK is added later, re-enable.

  // UserPreference associations
  UserPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // AuditLog associations
  AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // UserConsent associations
  UserConsent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // AiConversation associations
  AiConversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  AiConversation.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

  // Counselor associations
  CounselorService.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });
  CounselorAvailabilityWindow.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });
  CounselorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  CounselorGoogleToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  CounselorAppointment.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });
  CounselorAppointment.belongsTo(User, { foreignKey: 'parentUserId', as: 'parent' });

  // Expert consultation associations
  ExpertConsultation.belongsTo(User, { foreignKey: 'parentUserId', as: 'parent' });
  ExpertConsultation.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });
  ExpertConsultation.belongsTo(ExpertConsultationSlot, { foreignKey: 'slotId', as: 'slot' });
  ExpertConsultationSlot.hasOne(ExpertConsultation, { foreignKey: 'slotId', as: 'consultation' });
  User.hasMany(ExpertConsultation, { foreignKey: 'parentUserId', as: 'expertConsultations' });
}

/**
 * Shutdown database connection gracefully
 */
export async function shutdownDb(): Promise<void> {
  if (_sequelize) {
    await _sequelize.close();
    _sequelize = null;
  }
}

// Legacy export for backward compatibility (deprecated)
// Use getSequelize() instead
export const sequelize = new Proxy({} as Sequelize, {
  get: (target, prop) => {
    const instance = getSequelize();
    return instance[prop as keyof Sequelize];
  },
});

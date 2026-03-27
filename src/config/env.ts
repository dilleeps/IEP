import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().optional(), // for prod
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default("iep_database"),
  POSTGRES_USER: z.string().default("iep_user"),
  POSTGRES_PASSWORD: z.string().default("yourpassword"),
  PG_CA_CERT_PATH: z.string().optional(),
  PG_CLIENT_CERT_PATH: z.string().optional(),
  PG_KEY_CERT_PATH: z.string().optional(),

  OTEL_SERVICE_NAME: z.string().default("iep-api"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(), // if you want http exporter later
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.string().optional(),
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: z.string().optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRATION_TIME_IN_MINUTES: z.coerce.number().default(60),

  // Logging
  ENABLE_HTTP_LOGGING: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),

  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),
  GOOGLE_OAUTH_SCOPES: z.string().optional(),
  GOOGLE_TOKEN_ENCRYPTION_KEY: z.string().optional(),
  COUNSELOR_GOOGLE_SUCCESS_REDIRECT: z.string().optional(),
  COUNSELOR_GOOGLE_FAILURE_REDIRECT: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);

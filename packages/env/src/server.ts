import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../../");

config({ path: path.join(monorepoRoot, ".env") });

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		REDIS_URL: z.string().default("redis://localhost:6379"),
		OPENROUTER_API_KEY: z.string().min(1),
		CREDENTIAL_ENCRYPTION_KEY: z.string().min(32),

		// GitHub (optional — legacy OAuth only)
		GITHUB_CLIENT_ID: z.string().optional(),
		GITHUB_CLIENT_SECRET: z.string().optional(),

		// Telegram (optional for non-live demo)
		TELEGRAM_BOT_TOKEN: z.string().optional(),
		TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
		TELEGRAM_MANAGER_CHAT_ID: z.string().optional(),

		// Demo inventory API
		DEMO_INVENTORY_API_BASE_URL: z.url().default("http://localhost:4301"),
		DEMO_INVENTORY_API_KEY: z.string().default("demo-inventory-key"),

		// Other optional providers
		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),
		RESEND_API_KEY: z.string().optional(),
		RESEND_FROM_EMAIL: z.string().optional(),

		// S3-compatible storage
		S3_ENDPOINT: z.string().default("http://localhost:9000"),
		S3_REGION: z.string().default("us-east-1"),
		S3_ACCESS_KEY_ID: z.string().default("minioadmin"),
		S3_SECRET_ACCESS_KEY: z.string().default("minioadmin"),
		S3_BUCKET: z.string().default("runguard-dev"),
		S3_FORCE_PATH_STYLE: z
			.enum(["true", "false"])
			.default("true")
			.transform((v) => v === "true"),
		S3_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(26214400),
		S3_ALLOWED_MIME_TYPES: z
			.string()
			.default(
				"image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});

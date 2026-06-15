import * as schema from "@agentclave/db/schema/auth";
import { eq, asc } from "drizzle-orm";
import { env } from "@agentclave/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { ac, roles } from "./permissions";
import { db } from "./db-instance";
import { onUserCreateAfter } from "./user-create-after";

export function createAuth() {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "lax",
				secure: false,
				httpOnly: true,
				domain: "localhost",
			},
		},
		databaseHooks: {
			session: {
				create: {
					before: async (session) => {
						// Restore the active organization from the user's earliest membership
						const [firstMember] = await db
							.select()
							.from(schema.member)
							.where(eq(schema.member.userId, session.userId))
							.orderBy(asc(schema.member.createdAt))
							.limit(1);

						return {
							data: {
								...session,
								activeOrganizationId: firstMember?.organizationId ?? undefined,
							},
						};
					},
				},
			},
			user: {
				create: {
					after: async (user) => {
						try {
							await onUserCreateAfter(user);
						} catch (err) {
							console.error("[auth.databaseHooks.user.create.after] bootstrap failed", err);
						}
					},
				},
			},
		},
		plugins: [
			organization({
				ac,
				roles,
			}),
		],
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID ?? "",
				clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
			},
			google: {
				clientId: env.GOOGLE_CLIENT_ID ?? "",
				clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
			},
		},
	});
}

export const auth = createAuth();

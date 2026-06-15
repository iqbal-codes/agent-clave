import { env } from "@agentclave/env/server";
import { encryptSecret as encryptSecretBase, decryptSecret as decryptSecretBase } from "@agentclave/env/credentials";

export function encryptSecret(value: unknown): string {
	return encryptSecretBase(value, env.CREDENTIAL_ENCRYPTION_KEY);
}

export function decryptSecret<T = Record<string, unknown>>(encrypted: string | null): T | null {
	return decryptSecretBase<T>(encrypted, env.CREDENTIAL_ENCRYPTION_KEY);
}

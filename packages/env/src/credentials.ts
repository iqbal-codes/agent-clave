import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function deriveKey(encryptionKey: string): Buffer {
	return createHash("sha256").update(encryptionKey).digest();
}

export function encryptSecret(value: unknown, encryptionKey: string): string {
	const key = deriveKey(encryptionKey);
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	const plaintext = JSON.stringify(value);
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();

	return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret<T = Record<string, unknown>>(
	encrypted: string | null,
	encryptionKey: string,
): T | null {
	if (!encrypted) return null;

	const parts = encrypted.split(":");
	if (parts.length !== 4 || parts[0] !== "v1") {
		throw new Error("Invalid encrypted secret format");
	}

	const ivB64 = parts[1]!;
	const tagB64 = parts[2]!;
	const dataB64 = parts[3]!;
	const key = deriveKey(encryptionKey);
	const iv = Buffer.from(ivB64, "base64");
	const tag = Buffer.from(tagB64, "base64");
	const encryptedData = Buffer.from(dataB64, "base64");

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(tag);
	const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

	return JSON.parse(decrypted.toString("utf8")) as T;
}

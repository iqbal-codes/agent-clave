import { createHash, timingSafeEqual } from "node:crypto";
import { decryptSecret } from "../credentials";

interface WebhookEndpoint {
	verificationType: string;
	secretHeaderName: string | null;
	encryptedSecret: string | null;
}

export function verifyWebhookRequest(input: {
	endpoint: WebhookEndpoint;
	rawBody: string;
	headers: Headers;
}): boolean {
	const { endpoint, rawBody, headers } = input;

	if (endpoint.verificationType === "none") {
		return true;
	}

	if (endpoint.verificationType === "header_secret") {
		if (!endpoint.secretHeaderName || !endpoint.encryptedSecret) {
			return false;
		}

		const headerValue = headers.get(endpoint.secretHeaderName);
		if (!headerValue) {
			return false;
		}

		const decrypted = decryptSecret<{ secret: string }>(endpoint.encryptedSecret);
		if (!decrypted) {
			return false;
		}

		const headerBuf = Buffer.from(headerValue);
		const secretBuf = Buffer.from(decrypted.secret);

		if (headerBuf.length !== secretBuf.length) {
			return false;
		}

		return timingSafeEqual(headerBuf, secretBuf);
	}

	if (endpoint.verificationType === "hmac_sha256") {
		if (!endpoint.secretHeaderName || !endpoint.encryptedSecret) {
			return false;
		}

		const headerValue = headers.get(endpoint.secretHeaderName);
		if (!headerValue || !headerValue.startsWith("sha256=")) {
			return false;
		}

		const providedSig = headerValue.slice(7);
		const decrypted = decryptSecret<{ secret: string }>(endpoint.encryptedSecret);
		if (!decrypted) {
			return false;
		}

		const expectedSig = createHash("sha256").update(decrypted.secret).update(rawBody).digest("hex");

		const providedBuf = Buffer.from(providedSig, "hex");
		const expectedBuf = Buffer.from(expectedSig, "hex");

		if (providedBuf.length !== expectedBuf.length) {
			return false;
		}

		return timingSafeEqual(providedBuf, expectedBuf);
	}

	return false;
}

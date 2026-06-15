import { createHmac, timingSafeEqual } from "node:crypto";

const ALGORITHM = "sha256";
const PREFIX = "sha256=";

export function verifyGitHubSignature(
	rawBody: string | Uint8Array,
	signatureHeader: string | null | undefined,
	secret: string,
): boolean {
	if (!signatureHeader || !signatureHeader.startsWith(PREFIX)) {
		return false;
	}

	const expectedSignature = signatureHeader.slice(PREFIX.length);
	if (expectedSignature.length !== 64) {
		return false;
	}

	const bodyBuffer =
		typeof rawBody === "string"
			? Buffer.from(rawBody, "utf-8")
			: Buffer.from(rawBody);

	const hmac = createHmac(ALGORITHM, secret);
	hmac.update(bodyBuffer);
	const computedSignature = hmac.digest("hex");

	if (computedSignature.length !== expectedSignature.length) {
		return false;
	}

	return timingSafeEqual(
		Buffer.from(computedSignature, "hex"),
		Buffer.from(expectedSignature, "hex"),
	);
}

import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyGitHubSignature } from "./signature";

const SECRET = "test-secret-key";

function sign(body: string, secret = SECRET): string {
	const hmac = createHmac("sha256", secret);
	hmac.update(body);
	return `sha256=${hmac.digest("hex")}`;
}

describe("verifyGitHubSignature", () => {
	it("returns true for a valid signature", () => {
		const rawBody = '{"action":"opened"}';
		expect(verifyGitHubSignature(rawBody, sign(rawBody), SECRET)).toBe(true);
	});

	it("returns false for a tampered body", () => {
		const originalBody = '{"action":"opened"}';
		const tamperedBody = '{"action":"closed"}';
		expect(verifyGitHubSignature(tamperedBody, sign(originalBody), SECRET)).toBe(false);
	});

	it("returns false for null signature", () => {
		expect(verifyGitHubSignature("body", null, SECRET)).toBe(false);
	});

	it("returns false for undefined signature", () => {
		expect(verifyGitHubSignature("body", undefined, SECRET)).toBe(false);
	});

	it("returns false for signature without sha256= prefix", () => {
		expect(verifyGitHubSignature("body", "abc123", SECRET)).toBe(false);
	});

	it("returns false for signature with wrong length", () => {
		expect(verifyGitHubSignature("body", "sha256=short", SECRET)).toBe(false);
	});

	it("returns false when secret is wrong", () => {
		const rawBody = '{"action":"opened"}';
		expect(verifyGitHubSignature(rawBody, sign(rawBody), "wrong-secret")).toBe(false);
	});

	it("works with Uint8Array body", () => {
		const rawBody = '{"action":"opened"}';
		const bodyUint8 = new TextEncoder().encode(rawBody);
		expect(verifyGitHubSignature(bodyUint8, sign(rawBody), SECRET)).toBe(true);
	});
});

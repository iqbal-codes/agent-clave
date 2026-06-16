export function stringifyJson(value: unknown, fallback: Record<string, unknown> = {}): string {
	if (value === null || value === undefined) return JSON.stringify(fallback, null, 2);
	return JSON.stringify(value, null, 2);
}

export function parseJsonObject(text: string, fieldLabel: string): Record<string, unknown> {
	const trimmed = text.trim();
	if (!trimmed) throw new Error(`${fieldLabel} is required`);
	const parsed = JSON.parse(trimmed);
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${fieldLabel} must be a JSON object`);
	}
	return parsed as Record<string, unknown>;
}

export function parseOptionalJsonObject(
	text: string,
	fieldLabel: string,
): Record<string, unknown> | undefined {
	const trimmed = text.trim();
	if (!trimmed) return undefined;
	return parseJsonObject(text, fieldLabel);
}

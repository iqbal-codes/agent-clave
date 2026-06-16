import { Hono } from "hono";

interface Product {
	sku: string;
	name: string;
	aliases: string[];
	quantity: number;
}

interface StockAdjustment {
	adjustmentId: string;
	sku: string;
	previousQuantity: number;
	newQuantity: number;
	damageQuantity: number;
	reason: string;
	notes: string;
	createdAt: string;
}

// In-memory fixture data
const products: Product[] = [
	{
		sku: "BKSO-SOLO",
		name: "Bakso Solo 500g",
		aliases: ["bakso solo", "stok bakso solo"],
		quantity: 80,
	},
];

// In-memory idempotency store
const idempotencyStore = new Map<string, StockAdjustment>();

const DEMO_API_KEY = process.env.DEMO_INVENTORY_API_KEY ?? "demo-inventory-key";

const app = new Hono();

// Health check
app.get("/health", (c) => c.json({ ok: true }));

// Product search
app.get("/products/search", (c) => {
	const query = (c.req.query("q") ?? "").toLowerCase();
	if (!query) {
		return c.json({ results: [] });
	}

	const results = products.filter(
		(p) =>
			p.name.toLowerCase().includes(query) ||
			p.aliases.some((a) => a.toLowerCase().includes(query)) ||
			p.sku.toLowerCase().includes(query),
	);

	return c.json({ results });
});

// Get stock
app.get("/stock/:sku", (c) => {
	const sku = c.req.param("sku");
	const product = products.find((p) => p.sku === sku);
	if (!product) {
		return c.json({ error: "Product not found" }, 404);
	}
	return c.json({ sku: product.sku, quantity: product.quantity });
});

// Create stock adjustment
app.post("/stock-adjustments", async (c) => {
	// Auth check
	const authHeader = c.req.header("Authorization");
	if (DEMO_API_KEY && (!authHeader || authHeader !== `Bearer ${DEMO_API_KEY}`)) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Idempotency check
	const idempotencyKey = c.req.header("Idempotency-Key");
	if (!idempotencyKey) {
		return c.json({ error: "Idempotency-Key header required" }, 400);
	}

	const existing = idempotencyStore.get(idempotencyKey);
	if (existing) {
		return c.json(existing);
	}

	const body = (await c.req.json()) as {
		sku: string;
		newQuantity: number;
		reason: string;
		damageQuantity?: number;
		notes?: string;
	};

	const product = products.find((p) => p.sku === body.sku);
	if (!product) {
		return c.json({ error: "Product not found" }, 404);
	}

	const previousQuantity = product.quantity;
	product.quantity = body.newQuantity;

	const adjustment: StockAdjustment = {
		adjustmentId: `adj-${Date.now()}`,
		sku: body.sku,
		previousQuantity,
		newQuantity: body.newQuantity,
		damageQuantity: body.damageQuantity ?? 0,
		reason: body.reason,
		notes: body.notes ?? "",
		createdAt: new Date().toISOString(),
	};

	idempotencyStore.set(idempotencyKey, adjustment);

	return c.json(adjustment);
});

export { app };

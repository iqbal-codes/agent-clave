import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

// Route through the Vite proxy so the browser doesn't hit CORS/cookie issues.
// The Vite dev server proxies /api/* to the API server on port 4000.
const API_URL = import.meta.env.VITE_API_URL || "";

export const authClient = createAuthClient({
	baseURL: API_URL,
	plugins: [organizationClient()],
});



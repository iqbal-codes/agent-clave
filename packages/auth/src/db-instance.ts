// Re-export the shared db instance from @agentclave/db. Centralizing the
// instance here avoids creating a second pg connection pool inside the auth
// package, and gives every auth-side module a single import path.
export { db } from "@agentclave/db";

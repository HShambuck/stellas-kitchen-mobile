import client from "./client";

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * Register a new staff or rider account.
 *
 * Staff payload adds:   { locationToken: string }
 * Rider payload adds:   { vehicleType: string, vehiclePlate?: string }
 *
 * @param {Object} payload
 * @param {"staff"|"rider"} payload.role
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string} payload.password
 * @param {string} [payload.locationToken]   — staff only
 * @param {string} [payload.vehicleType]     — rider only
 * @param {string} [payload.vehiclePlate]    — rider only (optional)
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function register(payload) {
  const res = await client.post("/api/auth/register", payload);
  return res.data;
}

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * Authenticate with email + password.
 * Server returns JWT plus identity flags (role, name, id).
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function login(email, password) {
  const res = await client.post("/api/auth/login", { email, password });
  return res.data;
}

// ─── Profile ──────────────────────────────────────────────────────────────────
/**
 * Fetch the authenticated user's profile.
 * Requires a valid JWT to be attached by the interceptor.
 *
 * @returns {Promise<Object>}
 */
export async function getProfile() {
  const res = await client.get("/api/auth/profile");
  return res.data;
}

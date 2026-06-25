import client from "./client";

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * Register a new staff or rider account.
 * Automatically handles routing to /staff/register or /rider/register.
 *
 * @param {Object} payload
 * @param {"staff"|"rider"} payload.role
 * @param {string} payload.name
 * @param {string} payload.phoneNumber
 * @param {string} payload.password
 * @param {string} [payload.locationToken]   — staff only
 * @param {string} [payload.vehicleType]     — rider only
 * @param {string} [payload.vehiclePlate]    — rider only (optional)
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function register(payload) {
  // Check the role parameter to route dynamically
  const userType = payload.role?.toLowerCase() === "rider" ? "rider" : "staff";
  
  const res = await client.post(`/api/auth/${userType}/register`, payload);
  return res.data;
}

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * Authenticate with phone number + password for both roles.
 *
 * @param {string} phoneNumber
 * @param {string} password
 * @param {"staff"|"rider"} role - Explicitly passed from your UI screen state selection
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function login(phoneNumber, password, role = "staff") {
  // Determine endpoint path prefix based on user selection card
  const userType = role?.toLowerCase() === "rider" ? "rider" : "staff";

  // Both roles now use a standard unified phone number credential layout
  const credentials = { phoneNumber, password };

  const res = await client.post(`/api/auth/${userType}/login`, credentials);
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
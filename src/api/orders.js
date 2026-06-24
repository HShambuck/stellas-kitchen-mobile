import client from "./client";

// ─── Staff Endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/orders/pending
 * Returns all orders currently awaiting kitchen action.
 *
 * @returns {Promise<Array>}
 */
export async function getPendingOrders() {
  const res = await client.get("/api/orders/pending");
  return res.data;
}

/**
 * PUT /api/orders/:id/status
 * Moves an order through the kitchen lifecycle.
 *
 * @param {string|number} orderId
 * @param {"PREPARING"|"READY_FOR_PICKUP"|"OUT_FOR_DELIVERY"|"DELIVERED"} status
 * @returns {Promise<Object>} Updated order
 */
export async function updateOrderStatus(orderId, status) {
  const res = await client.put(`/api/orders/${orderId}/status`, { status });
  return res.data;
}

// ─── Rider Endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/orders/available-deliveries
 * Returns orders that are READY_FOR_PICKUP and within Shai Hills geo-range.
 *
 * @returns {Promise<Array>}
 */
export async function getAvailableDeliveries() {
  const res = await client.get("/api/orders/available-deliveries");
  return res.data;
}

/**
 * GET /api/orders/my-active
 * Returns the rider's currently accepted / in-progress delivery (if any).
 *
 * @returns {Promise<Object|null>}
 */
export async function getMyActiveDelivery() {
  const res = await client.get("/api/orders/my-active");
  return res.data;
}

/**
 * POST /api/orders/:id/accept
 * Rider accepts a delivery from the available pool.
 *
 * @param {string|number} orderId
 * @returns {Promise<Object>}
 */
export async function acceptDelivery(orderId) {
  const res = await client.post(`/api/orders/${orderId}/accept`);
  return res.data;
}

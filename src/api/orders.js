import client from "./client";

// ─── Staff Endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/orders/pending
 * Returns all orders currently awaiting kitchen action.
 *
 * @returns {Promise<Array>}
 */
export async function getPendingOrders() {
  // The backend gets everything from /api/orders and handles security filters
  const res = await client.get("/api/orders"); 
  return res.data;
}

/**
 * PATCH /api/orders/:id/status
 * Moves an order through the kitchen lifecycle.
 *
 * @param {string} orderId
 * @param {"Pending"|"Preparing"|"Ready for Dispatch"|"Delivered"} statusState
 * @returns {Promise<Object>} Updated order
 */
export async function updateOrderStatus(orderId, statusState) {
  // 💡 Changed from client.put to client.patch 
  // 💡 Changed payload key from { status } to { statusState }
  const res = await client.patch(`/api/orders/${orderId}/status`, { statusState });
  return res.data;
}

/**
 * POST /api/orders
 * Staff manually creates an order.
 */
export async function createOrder(payload) {
  const res = await client.post("/api/orders", payload);
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
export const getMyActiveDelivery = async () => {
  const res = await client.get("/api/riders/my-deliveries");
  return res.data;
};

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


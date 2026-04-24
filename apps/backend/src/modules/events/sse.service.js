'use strict';
/**
 * SSE Service — in-process pub/sub for real-time task updates.
 * Keeps a map of orgId → Set<response objects>.
 * When a task mutation happens, broadcastToOrg() pushes an event
 * to every connected client in that org.
 */

// Map<orgId, Set<res>>
const clients = new Map();

/**
 * Register a new SSE client for the given org.
 * Returns an unsubscribe function to call on disconnect.
 */
function subscribe(orgId, res) {
  if (!clients.has(orgId)) {
    clients.set(orgId, new Set());
  }
  clients.get(orgId).add(res);

  return function unsubscribe() {
    const orgClients = clients.get(orgId);
    if (orgClients) {
      orgClients.delete(res);
      if (orgClients.size === 0) clients.delete(orgId);
    }
  };
}

/**
 * Broadcast a typed event to every SSE client in an org.
 * @param {string} orgId
 * @param {string} eventType  e.g. 'task:created'
 * @param {object} payload    JSON-serialisable data
 */
function broadcastToOrg(orgId, eventType, payload) {
  const orgClients = clients.get(orgId);
  if (!orgClients || orgClients.size === 0) return;

  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of orgClients) {
    try {
      res.write(data);
    } catch {
      // Client disconnected mid-write — will be cleaned up on 'close'
    }
  }
}

module.exports = { subscribe, broadcastToOrg };
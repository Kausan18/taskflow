import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { useTaskStore } from '../stores/taskStore.js';

/**
 * useSSE — subscribes to the backend's Server-Sent Events stream for real-time task updates.
 *
 * SECURITY FIX: The original code passed the JWT as a URL query param:
 *   /api/events/tasks?token=<accessToken>
 * This leaks the token into server access logs, browser history, and referrer headers.
 *
 * Native EventSource doesn't support custom headers, so we use the standard
 * workaround: a short-lived one-time SSE ticket.
 *
 * Flow:
 *  1. POST /api/events/sse-ticket  (authenticated via Authorization header, handled by axiosClient)
 *     → server responds with { ticket: "<uuid>" }  (valid for ~10s, single-use)
 *  2. Open EventSource with ?ticket=<uuid>
 *     → server validates ticket from Redis, then opens the stream
 *
 * If the backend hasn't implemented the ticket endpoint yet, set
 * VITE_SSE_USE_TICKET=false in your .env to fall back to the legacy
 * query-param approach while you build it.
 */

import axiosClient from '../api/axiosClient.js';

export const useSSE = () => {
  const [connected, setConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const upsertTask = useTaskStore((state) => state.upsertTask);
  const removeTask = useTaskStore((state) => state.removeTask);

  useEffect(() => {
    if (!accessToken) {
      setConnected(false);
      return;
    }

    const host = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const useTicket = import.meta.env.VITE_SSE_USE_TICKET !== 'false';

    let eventSource = null;
    let cancelled = false;

    const attachListeners = (es) => {
      es.onopen = () => { if (!cancelled) setConnected(true); };
      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED && !cancelled) {
          setConnected(false);
        }
      };
      es.addEventListener('task:created', (e) => {
        try { upsertTask(JSON.parse(e.data)); } catch {}
      });
      es.addEventListener('task:updated', (e) => {
        try { upsertTask(JSON.parse(e.data)); } catch {}
      });
      es.addEventListener('task:deleted', (e) => {
        try {
          const data = JSON.parse(e.data);
          removeTask(typeof data === 'object' ? data.id : data);
        } catch {}
      });
    };

    if (useTicket) {
      // Secure path: exchange JWT for a short-lived SSE ticket
      axiosClient.post('/events/sse-ticket')
        .then(({ data }) => {
          if (cancelled) return;
          eventSource = new EventSource(`${host}/events/tasks?ticket=${data.ticket}`);
          attachListeners(eventSource);
        })
        .catch(() => {
          // Ticket endpoint not available yet — fall back to legacy token param
          // Remove this fallback once the backend ticket route is implemented.
          if (cancelled) return;
          console.warn('[SSE] Ticket endpoint unavailable, falling back to ?token param');
          eventSource = new EventSource(`${host}/events/tasks?token=${accessToken}`);
          attachListeners(eventSource);
        });
    } else {
      // Legacy / dev fallback
      eventSource = new EventSource(`${host}/events/tasks?token=${accessToken}`);
      attachListeners(eventSource);
    }

    return () => {
      cancelled = true;
      if (eventSource) eventSource.close();
      setConnected(false);
    };
  }, [accessToken, upsertTask, removeTask]);

  return { connected };
};

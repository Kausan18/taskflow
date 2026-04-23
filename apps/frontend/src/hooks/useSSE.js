import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { useTaskStore } from '../stores/taskStore.js';

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
    const eventSource = new EventSource(`${host}/events/tasks?token=${accessToken}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onerror = (err) => {
      console.error('SSE Connection Error:', err);
      // EventSource tries connecting automatically on issues
      if (eventSource.readyState === EventSource.CLOSED) {
        setConnected(false);
      }
    };

    eventSource.addEventListener('task:created', (event) => {
      try {
        const data = JSON.parse(event.data);
        upsertTask(data);
      } catch (e) {
        console.error('SSE task:created parse error', e);
      }
    });

    eventSource.addEventListener('task:updated', (event) => {
      try {
        const data = JSON.parse(event.data);
        upsertTask(data);
      } catch (e) {
        console.error('SSE task:updated parse error', e);
      }
    });

    eventSource.addEventListener('task:deleted', (event) => {
      try {
        const data = JSON.parse(event.data);
        const id = typeof data === 'object' && data !== null ? data.id : data;
        removeTask(id);
      } catch (e) {
        console.error('SSE task:deleted parse error', e);
      }
    });

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [accessToken, upsertTask, removeTask]);

  return { connected };
};

import { clientsApi, projectsApi, usersApi, fiverrProfilesApi, bonusSchemesApi, performanceApi, systemHealthApi, briefsApi, issuesApi, meetingsApi, payoutsApi, aiRulesApi, activityLogsApi } from '../api/client';

// Central Broadcast Channel for Zero-Latency Multi-Tab Real-time Sync
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('kodevio_realtime_sync_channel')
  : null;

const listeners = new Map();

export const LiveSyncEngine = {
  // Subscribe to changes for a specific entity or '*' for all
  subscribe(entity, callback) {
    if (!listeners.has(entity)) {
      listeners.set(entity, new Set());
    }
    listeners.get(entity).add(callback);

    return () => {
      if (listeners.has(entity)) {
        listeners.get(entity).delete(callback);
      }
    };
  },

  // Notify local subscribers
  notify(entity, payload) {
    if (listeners.has(entity)) {
      listeners.get(entity).forEach((cb) => {
        try { cb(payload); } catch (e) { console.error(e); }
      });
    }
    if (listeners.has('*')) {
      listeners.get('*').forEach((cb) => {
        try { cb({ entity, payload }); } catch (e) { console.error(e); }
      });
    }
  },

  // Broadcast change to other tabs & backend write-through
  broadcast(entity, payload) {
    this.notify(entity, payload);

    if (channel) {
      try {
        channel.postMessage({ entity, payload, timestamp: Date.now() });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  },

  // Trigger full system sync & recalculation
  async syncAll() {
    try {
      const res = await systemHealthApi.triggerFullSync();
      if (res?.success) {
        this.broadcast('*', { action: 'FULL_SYNC', data: res });
      }
      return res;
    } catch (err) {
      console.warn('SyncAll error:', err.message);
      return null;
    }
  },

  // Fetch live health & connection metrics
  async checkHealth() {
    try {
      const res = await systemHealthApi.getHealth();
      return res?.health || null;
    } catch (err) {
      console.warn('CheckHealth error:', err.message);
      return null;
    }
  }
};

// Initialize multi-tab message listener
if (channel) {
  channel.onmessage = (event) => {
    const { entity, payload } = event.data || {};
    if (entity) {
      LiveSyncEngine.notify(entity, payload);
    }
  };
}

// Storage event listener fallback for older browsers
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('kodevio_')) {
      const entity = e.key.replace('kodevio_', '').replace('_db', '');
      let parsed = null;
      try { parsed = JSON.parse(e.newValue); } catch (err) {}
      LiveSyncEngine.notify(entity, parsed);
    }
  });
}

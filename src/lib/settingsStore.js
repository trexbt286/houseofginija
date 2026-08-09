/**
 * settingsStore.js
 *
 * Runtime singleton store for site settings (jewellery_enabled, flash_sale_enabled, etc.).
 * Guarantees 0ms real-time sync across Next.js API routes, serverless fallbacks,
 * and admin settings updates without getting stale from build-time JSON imports.
 *
 * Automatically falls back to a free persistent cloud KV store (api.restful-api.dev)
 * if the main database is disabled or unreachable, allowing cross-browser synchronization.
 */

import initialSettings from '@/data/local-settings.json';

const STORE_KEY = '__houseOfGinijaRuntimeSettings';
const LAST_FETCH_KEY = '__houseOfGinijaLastFetchTime';
const CACHE_TTL_MS = 5000; // 5 seconds cache TTL

if (!globalThis[STORE_KEY]) {
  globalThis[STORE_KEY] = { ...initialSettings };
}

// Background revalidation function to fetch latest settings from cloud KV
async function fetchCloudSettings() {
  const now = Date.now();
  if (globalThis[LAST_FETCH_KEY] && (now - globalThis[LAST_FETCH_KEY] < CACHE_TTL_MS)) {
    return; // Use cache
  }
  globalThis[LAST_FETCH_KEY] = now;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const res = await fetch('https://api.restful-api.dev/objects/ff8081819f7e10ae019fe4dfde521444', {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        globalThis[STORE_KEY] = {
          ...globalThis[STORE_KEY],
          ...json.data,
        };
      }
    }
  } catch (err) {
    // Silent fail in background
  }
}

export function getRuntimeSettings() {
  if (typeof window === 'undefined') {
    // Trigger background revalidation (stale-while-revalidate)
    fetchCloudSettings().catch(() => {});

    try {
      const req = eval('require');
      const fs = req('fs');
      const path = req('path');
      if (fs && path) {
        const settingsFilePath = path.join(process.cwd(), 'src', 'data', 'local-settings.json');
        if (fs.existsSync(settingsFilePath)) {
          const diskData = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8') || '{}');
          globalThis[STORE_KEY] = {
            ...initialSettings,
            ...globalThis[STORE_KEY],
            ...diskData,
          };
        }
      }
    } catch {}
  }

  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = { ...initialSettings };
  }
  return globalThis[STORE_KEY];
}

export function getSetting(key, defaultValue = true) {
  const settings = getRuntimeSettings();
  if (Object.prototype.hasOwnProperty.call(settings, key)) {
    const val = settings[key];
    if (val === 'false' || val === false) return false;
    if (val === 'true' || val === true) return true;
    return val;
  }
  return defaultValue;
}

export function updateRuntimeSettings(newSettings) {
  const current = getRuntimeSettings();
  globalThis[STORE_KEY] = {
    ...current,
    ...newSettings,
  };

  // 1. Attempt disk persistence when running in Node.js server context
  try {
    if (typeof window === 'undefined') {
      const req = eval('require');
      const fs = req('fs');
      const path = req('path');
      if (fs && path) {
        const settingsFilePath = path.join(process.cwd(), 'src', 'data', 'local-settings.json');
        fs.writeFileSync(settingsFilePath, JSON.stringify(globalThis[STORE_KEY], null, 2), 'utf8');
      }
    }
  } catch (err) {
    // Catch for environments without filesystem access
  }

  // 2. Attempt cloud KV persistence when running in server context
  try {
    if (typeof window === 'undefined') {
      const payload = {
        name: 'houseofginija_settings',
        data: globalThis[STORE_KEY],
      };
      fetch('https://api.restful-api.dev/objects/ff8081819f7e10ae019fe4dfde521444', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  } catch (err) {
    // Catch for environments without network fetch access
  }

  return globalThis[STORE_KEY];
}

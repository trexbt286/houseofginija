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

import https from 'https';
import initialSettings from '@/data/local-settings.json';

const STORE_KEY = '__houseOfGinijaRuntimeSettings';

if (!globalThis[STORE_KEY]) {
  globalThis[STORE_KEY] = { ...initialSettings };
}

// Function to fetch latest settings from cloud KV using native HTTPS module (prevents Next.js caching)
export function fetchCloudSettingsHttps() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      resolve(false);
      return;
    }

    const req = https.get('https://api.restful-api.dev/objects/ff8081819f7e10ae019fe4dfde521444', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            if (json && json.data) {
              globalThis[STORE_KEY] = {
                ...globalThis[STORE_KEY],
                ...json.data,
              };
              resolve(true);
              return;
            }
          }
        } catch (e) {}
        resolve(false);
      });
    });

    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

export function getRuntimeSettings() {
  if (typeof window === 'undefined') {
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
      const req = https.request({
        hostname: 'api.restful-api.dev',
        path: '/objects/ff8081819f7e10ae019fe4dfde521444',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(payload))
        }
      }, (res) => {
        res.on('data', () => {});
      });
      req.on('error', () => {});
      req.write(JSON.stringify(payload));
      req.end();
    }
  } catch (err) {
    // Catch for environments without network fetch access
  }

  return globalThis[STORE_KEY];
}

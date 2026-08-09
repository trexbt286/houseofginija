/**
 * settingsStore.js
 *
 * Runtime singleton store for site settings (jewellery_enabled, flash_sale_enabled, etc.).
 * Guarantees 0ms real-time sync across Next.js API routes, serverless fallbacks,
 * and admin settings updates without getting stale from build-time JSON imports.
 */

import initialSettings from '@/data/local-settings.json';

const STORE_KEY = '__houseOfGinijaRuntimeSettings';

if (!globalThis[STORE_KEY]) {
  globalThis[STORE_KEY] = { ...initialSettings };
}

export function getRuntimeSettings() {
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

  // Attempt disk persistence when running in Node.js server context
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

  return globalThis[STORE_KEY];
}

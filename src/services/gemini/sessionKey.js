/**
 * Client-supplied key handling.
 *
 * A key the user pastes in is kept in `sessionStorage` for that browser tab
 * only. It is never written to disk, never bundled, and never leaves the
 * browser except as an `x-goog-api-key` header to the provider.
 */

/** Storage key for the opt-in, session-scoped provider key. */
const CLIENT_KEY_STORAGE = 'pureair.geminiKey';

export function getClientSuppliedKey() {
  try {
    return sessionStorage.getItem(CLIENT_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

/**
 * Store a user-supplied key for this browser session only.
 * @param {string} key
 * @returns {boolean} success
 */
export function setClientSuppliedKey(key) {
  const value = String(key || '').trim();
  if (value.length < 20) return false;
  try {
    sessionStorage.setItem(CLIENT_KEY_STORAGE, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove any user-supplied key from this session.
 */
export function clearClientSuppliedKey() {
  try {
    sessionStorage.removeItem(CLIENT_KEY_STORAGE);
  } catch {
    /* storage unavailable - nothing to clear */
  }
}

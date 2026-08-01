import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTH_STORAGE_KEY,
  clearInvalidAuthPersistence,
  runWithAuthSessionTimeout,
} from '../store/authStore';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test('invalid auth recovery removes only auth persistence and session identity', () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  localStorage.setItem(AUTH_STORAGE_KEY, '{broken');
  localStorage.setItem('unrelated', 'keep');
  sessionStorage.setItem('auth-session-user-id', 'obsolete-user');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage, sessionStorage },
  });

  clearInvalidAuthPersistence();

  assert.equal(localStorage.getItem(AUTH_STORAGE_KEY), null);
  assert.equal(sessionStorage.getItem('auth-session-user-id'), null);
  assert.equal(localStorage.getItem('unrelated'), 'keep');
  delete (globalThis as { window?: unknown }).window;
});

test('session recovery settles when the auth endpoint never responds', async () => {
  await assert.rejects(
    runWithAuthSessionTimeout(
      (signal) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error(String(signal.reason))));
      }),
      10,
    ),
    /AUTH_SESSION_TIMEOUT/,
  );
});

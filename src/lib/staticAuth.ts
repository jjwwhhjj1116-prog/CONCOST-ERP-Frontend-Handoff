import { isDemoLocalMode } from '@/lib/runtimeExecutionMode';

const STATIC_AUTH_ACCOUNTS = [
  {
    identifier: 'demo.cc.001@example.invalid',
    userId: 'demo-cc-admin-001',
    salt: 'concost-demo-admin-v1',
    iterations: 210_000,
    passwordHash: 'TnwLP7PvsaST0cT1mNcwfTMyW3gQmTmvapVhk6bVp4Y=',
  },
  {
    identifier: 'demo.vq.001@example.invalid',
    userId: 'demo-vq-manager-001',
    salt: 'vietqs-demo-manager-v1',
    iterations: 210_000,
    passwordHash: 'awVMZJbL/myhrxd7TdXXsQM98ZUBY/VikLYzq1oa1g0=',
  },
] as const;

const decodeBase64 = (value: string) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

const constantTimeEqual = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
};

export async function verifyStaticCredential(identifier: string, password: string) {
  if (!isDemoLocalMode()) return null;
  const normalized = identifier.trim().toLowerCase();
  const account = STATIC_AUTH_ACCOUNTS.find((candidate) => candidate.identifier === normalized);
  if (!account || !password || !globalThis.crypto?.subtle) return null;

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await globalThis.crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: new TextEncoder().encode(account.salt),
    iterations: account.iterations,
  }, key, 256);

  return constantTimeEqual(new Uint8Array(bits), decodeBase64(account.passwordHash))
    ? account.userId
    : null;
}

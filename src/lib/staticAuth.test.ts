import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyStaticCredential } from '@/lib/staticAuth';

test('static demo credentials work only in DEMO_LOCAL', async () => {
  const previous = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  assert.equal(
    await verifyStaticCredential('demo.cc.001@example.invalid', 'DemoOnly!2026'),
    'demo-cc-admin-001',
  );

  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'PRODUCTION_SERVER';
  assert.equal(
    await verifyStaticCredential('demo.cc.001@example.invalid', 'DemoOnly!2026'),
    null,
  );
  process.env.NEXT_PUBLIC_RUNTIME_MODE = previous;
});
test('synthetic Viet QS credential resolves a Viet QS persona', async () => {
  const previous = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  assert.equal(
    await verifyStaticCredential('demo.vq.001@example.invalid', 'DemoOnly!2026'),
    'demo-vq-manager-001',
  );
  process.env.NEXT_PUBLIC_RUNTIME_MODE = previous;
});

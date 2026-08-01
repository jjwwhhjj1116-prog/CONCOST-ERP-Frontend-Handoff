import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('release PII gate passes the current source tree', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/check-release-pii.mjs', process.cwd()],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  const result = JSON.parse(output) as { verdict: string; findingCount: number };
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.findingCount, 0);
});

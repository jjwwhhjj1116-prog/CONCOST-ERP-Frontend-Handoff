"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  assertSafeCommand,
  buildInvocation,
  runPrismaCommand,
} = require("./prisma-safe-command.cjs");

const serverRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(serverRoot, "package.json"), "utf8"),
);

const developmentEnv = {
  DATABASE_ENVIRONMENT: "development",
  DATABASE_URL: "postgresql://dev.invalid/example",
};

const testEnv = {
  DATABASE_ENVIRONMENT: "test",
  DATABASE_URL: "postgresql://test.invalid/example",
  TEST_DATABASE_URL: "postgresql://test.invalid/example",
};

const productionEnv = {
  DATABASE_ENVIRONMENT: "production",
  DATABASE_URL: "postgresql://prod.invalid/example",
};

test("production start only launches the compiled server", () => {
  assert.equal(packageJson.scripts.start, "node dist/server.js");
  assert.doesNotMatch(packageJson.scripts.start, /prisma|seed/i);
});

test("package scripts contain no data-loss acceptance flag", () => {
  const forbiddenFlag = ["--accept", "data-loss"].join("-");
  assert.equal(JSON.stringify(packageJson).includes(forbiddenFlag), false);
});

test("package lifecycle hooks cannot mutate or seed a database", () => {
  assert.equal(packageJson.prisma, undefined);
  for (const hook of ["prestart", "postinstall", "prepare"]) {
    assert.equal(packageJson.scripts[hook], undefined);
  }
});

test("database scripts expose the safe lifecycle commands", () => {
  assert.equal(packageJson.scripts["db:generate"], "prisma generate");
  assert.equal(packageJson.scripts["db:validate"], "prisma validate");
  assert.match(packageJson.scripts["db:migrate:status"], / status$/);
  assert.match(packageJson.scripts["db:migrate:deploy"], / deploy$/);
  assert.match(packageJson.scripts["db:migrate:dev"], / dev$/);
  assert.match(packageJson.scripts["db:seed"], / seed$/);
});

test("unsupported destructive operations are rejected", () => {
  assert.throws(
    () => assertSafeCommand("push", developmentEnv),
    /Unsupported Prisma operation/,
  );
  assert.throws(
    () => assertSafeCommand("reset", developmentEnv),
    /Unsupported Prisma operation/,
  );
});

test("production blocks development migration and seed", () => {
  assert.throws(
    () => assertSafeCommand("dev", productionEnv),
    /blocked for production/,
  );
  assert.throws(
    () => assertSafeCommand("seed", productionEnv),
    /blocked for production/,
  );
});

test("production deploy requires explicit approval", () => {
  assert.throws(
    () => assertSafeCommand("deploy", productionEnv),
    /PRISMA_MIGRATION_APPROVED=true/,
  );

  assert.doesNotThrow(() =>
    assertSafeCommand("deploy", {
      ...productionEnv,
      PRISMA_MIGRATION_APPROVED: "true",
    }),
  );
});

test("test commands require an isolated test database target", () => {
  assert.doesNotThrow(() => assertSafeCommand("deploy", testEnv));
  assert.throws(
    () =>
      assertSafeCommand("deploy", {
        ...testEnv,
        DATABASE_URL: "postgresql://other.invalid/example",
      }),
    /DATABASE_URL to equal TEST_DATABASE_URL/,
  );
});

test("non-production commands cannot target the production URL", () => {
  assert.throws(
    () =>
      assertSafeCommand("status", {
        ...developmentEnv,
        PRODUCTION_DATABASE_URL: developmentEnv.DATABASE_URL,
      }),
    /cannot target PRODUCTION_DATABASE_URL/,
  );
});

test("production identity comparison ignores credentials", () => {
  assert.throws(
    () =>
      assertSafeCommand("status", {
        DATABASE_ENVIRONMENT: "test",
        DATABASE_URL:
          "postgresql://test-user:test-pass@database.invalid:5432/main",
        TEST_DATABASE_URL:
          "postgresql://test-user:test-pass@database.invalid:5432/main",
        PRODUCTION_DATABASE_URL:
          "postgresql://prod-user:prod-pass@database.invalid:5432/main",
      }),
    /cannot target PRODUCTION_DATABASE_URL/,
  );
});

test("deploy invocation uses Prisma migrate deploy", () => {
  const invocation = buildInvocation("deploy", serverRoot);
  assert.deepEqual(invocation.args.slice(-2), ["migrate", "deploy"]);
});

test("migration child-process failures propagate to the release caller", () => {
  const exitCode = runPrismaCommand(
    "deploy",
    testEnv,
    () => ({ status: 23 }),
    serverRoot,
  );
  assert.equal(exitCode, 23);
});

"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env"),
  quiet: true,
});

const SUPPORTED_ENVIRONMENTS = new Set([
  "development",
  "test",
  "production",
]);

const COMMANDS = Object.freeze({
  status: {
    prismaArgs: ["migrate", "status"],
    allowedEnvironments: SUPPORTED_ENVIRONMENTS,
  },
  deploy: {
    prismaArgs: ["migrate", "deploy"],
    allowedEnvironments: SUPPORTED_ENVIRONMENTS,
  },
  dev: {
    prismaArgs: ["migrate", "dev"],
    allowedEnvironments: new Set(["development"]),
  },
  seed: {
    seed: true,
    allowedEnvironments: new Set(["development", "test"]),
  },
});

class PrismaSafetyError extends Error {
  constructor(message) {
    super(message);
    this.name = "PrismaSafetyError";
  }
}

function requireEnvironmentValue(env, key) {
  const value = env[key]?.trim();
  if (!value) {
    throw new PrismaSafetyError(`${key} is required.`);
  }
  return value;
}

function getDatabaseEnvironment(env) {
  const databaseEnvironment = requireEnvironmentValue(
    env,
    "DATABASE_ENVIRONMENT",
  ).toLowerCase();

  if (!SUPPORTED_ENVIRONMENTS.has(databaseEnvironment)) {
    throw new PrismaSafetyError(
      "DATABASE_ENVIRONMENT must be development, test, or production.",
    );
  }

  return databaseEnvironment;
}

function getDatabaseIdentity(databaseUrl) {
  let parsed;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new PrismaSafetyError("DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new PrismaSafetyError("DATABASE_URL must target PostgreSQL.");
  }

  const protocol = "postgresql:";
  const host = parsed.hostname.toLowerCase();
  const port = parsed.port || "5432";
  const database = parsed.pathname.replace(/^\/+/, "");

  if (!host || !database) {
    throw new PrismaSafetyError(
      "DATABASE_URL must include a host and database name.",
    );
  }

  return `${protocol}//${host}:${port}/${database}`;
}

function assertSafeCommand(mode, env = process.env) {
  const command = COMMANDS[mode];
  if (!command) {
    throw new PrismaSafetyError(`Unsupported Prisma operation: ${mode}`);
  }

  const databaseEnvironment = getDatabaseEnvironment(env);
  const databaseUrl = requireEnvironmentValue(env, "DATABASE_URL");
  const databaseIdentity = getDatabaseIdentity(databaseUrl);

  if (!command.allowedEnvironments.has(databaseEnvironment)) {
    throw new PrismaSafetyError(
      `${mode} is blocked for ${databaseEnvironment} databases.`,
    );
  }

  if (
    env.PRODUCTION_DATABASE_URL &&
    databaseEnvironment !== "production" &&
    databaseIdentity === getDatabaseIdentity(env.PRODUCTION_DATABASE_URL)
  ) {
    throw new PrismaSafetyError(
      "A non-production command cannot target PRODUCTION_DATABASE_URL.",
    );
  }

  if (databaseEnvironment === "test") {
    const testDatabaseUrl = requireEnvironmentValue(env, "TEST_DATABASE_URL");
    if (databaseUrl !== testDatabaseUrl) {
      throw new PrismaSafetyError(
        "Test commands require DATABASE_URL to equal TEST_DATABASE_URL.",
      );
    }
  }

  if (
    databaseEnvironment === "production" &&
    mode === "deploy" &&
    env.PRISMA_MIGRATION_APPROVED !== "true"
  ) {
    throw new PrismaSafetyError(
      "Production migration deploy requires PRISMA_MIGRATION_APPROVED=true.",
    );
  }

  return { command, databaseEnvironment };
}

function buildInvocation(mode, serverRoot = path.resolve(__dirname, "..")) {
  const command = COMMANDS[mode];
  if (!command) {
    throw new PrismaSafetyError(`Unsupported Prisma operation: ${mode}`);
  }

  if (command.seed) {
    return {
      executable: process.execPath,
      args: [
        path.join(serverRoot, "node_modules", "tsx", "dist", "cli.mjs"),
        path.join(serverRoot, "prisma", "seed.ts"),
      ],
      cwd: serverRoot,
    };
  }

  return {
    executable: process.execPath,
    args: [
      path.join(serverRoot, "node_modules", "prisma", "build", "index.js"),
      ...command.prismaArgs,
    ],
    cwd: serverRoot,
  };
}

function runPrismaCommand(
  mode,
  env = process.env,
  spawn = spawnSync,
  serverRoot = path.resolve(__dirname, ".."),
) {
  const { databaseEnvironment } = assertSafeCommand(mode, env);
  const invocation = buildInvocation(mode, serverRoot);

  if (env.PRISMA_SAFE_DRY_RUN === "true") {
    console.log(
      `[prisma-safe] ${mode} validated for ${databaseEnvironment}; no command executed.`,
    );
    return 0;
  }

  const result = spawn(invocation.executable, invocation.args, {
    cwd: invocation.cwd,
    env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return Number.isInteger(result.status) ? result.status : 1;
}

function main() {
  const mode = process.argv[2];

  try {
    process.exitCode = runPrismaCommand(mode);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Prisma safety error.";
    console.error(`[prisma-safe] ${message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  PrismaSafetyError,
  assertSafeCommand,
  buildInvocation,
  getDatabaseIdentity,
  getDatabaseEnvironment,
  runPrismaCommand,
};

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(process.argv[2] || scriptRoot);
const allowlistPath = join(root, 'scripts', 'release-binary-allowlist.json');
const allowlist = existsSync(allowlistPath)
  ? JSON.parse(readFileSync(allowlistPath, 'utf8')).files ?? {}
  : {};

const ignoredDirectories = new Set([
  '.git', '.next', 'coverage', 'dist', 'node_modules', 'out', '.turbo',
]);
const findings = [];
const scanned = { text: 0, binary: 0 };
const add = (file, kind, line = null) => findings.push({ file, kind, ...(line ? { line } : {}) });
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex').toUpperCase();

const walk = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
};

const lineAt = (text, offset) => text.slice(0, offset).split(/\r?\n/).length;
const emailPattern = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const tokenPatterns = [
  ['PRIVATE_KEY', /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/g],
  ['AWS_ACCESS_KEY', /AKIA[0-9A-Z]{16}/g],
  ['GITHUB_TOKEN', /(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/g],
  ['OPENAI_TOKEN', /\bsk-[A-Za-z0-9]{20,}/g],
];

for (const absolute of walk(root)) {
  const file = relative(root, absolute).split(sep).join('/');
  const buffer = readFileSync(absolute);
  const binary = buffer.includes(0);
  if (binary) {
    scanned.binary += 1;
    const expected = allowlist[file];
    if (!expected) add(file, 'UNREVIEWED_BINARY');
    else if (expected !== sha256(buffer)) add(file, 'BINARY_HASH_MISMATCH');
    continue;
  }

  scanned.text += 1;
  const text = buffer.toString('utf8');
  for (const match of text.matchAll(emailPattern)) {
    const domain = match[1].toLowerCase();
    if (domain === 'example.invalid') continue;
    const before = text.slice(Math.max(0, match.index - 80), match.index);
    const isUrlUserInfo = /[a-z][a-z0-9+.-]*:\/\/[^\s]*$/i.test(before);
    if (isUrlUserInfo && domain.endsWith('.invalid')) continue;
    add(file, 'NON_RESERVED_EMAIL', lineAt(text, match.index));
  }
  for (const [kind, pattern] of tokenPatterns) {
    for (const match of text.matchAll(pattern)) add(file, kind, lineAt(text, match.index));
  }
  for (const match of text.matchAll(/(?:[A-Za-z]:\\Users\\|\/Users\/)[^\s"'`]+/g)) {
    add(file, 'LOCAL_USER_PATH', lineAt(text, match.index));
  }
  for (const match of text.matchAll(/(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/([^\s/@:]+):([^\s/@]+)@([^\s/:]+)/gi)) {
    const host = match[3].toLowerCase();
    if (!host.endsWith('.invalid') && host !== 'localhost' && host !== '127.0.0.1') {
      add(file, 'DATABASE_CREDENTIAL', lineAt(text, match.index));
    }
  }
}

for (const relativePath of ['src/data/dummyPersonnel.json', 'json/personnel-cards.json', 'dummy/personnel-cards.json']) {
  const file = join(root, relativePath);
  if (!existsSync(file)) {
    add(relativePath, 'MISSING_PERSONNEL_FIXTURE');
    continue;
  }
  const payload = JSON.parse(readFileSync(file, 'utf8'));
  if (payload.synthetic !== true || !String(payload.source || '').startsWith('synthetic://')) {
    add(relativePath, 'NON_SYNTHETIC_DATASET');
  }
  const ids = new Set();
  for (const [index, person] of (payload.personnel ?? []).entries()) {
    const row = index + 1;
    if (!String(person.id || '').startsWith('demo-')) add(relativePath, 'NON_SYNTHETIC_PERSONNEL_ID', row);
    if (!String(person.employeeNumber || '').startsWith('DEMO-')) add(relativePath, 'NON_SYNTHETIC_EMPLOYEE_NUMBER', row);
    if (!String(person.name || '').startsWith('[DEMO]')) add(relativePath, 'NON_SYNTHETIC_PERSON_NAME', row);
    if (!String(person.email || '').endsWith('@example.invalid')) add(relativePath, 'NON_RESERVED_PERSON_EMAIL', row);
    if (person.phone || person.address || person.dateOfBirth || person.birthDate || person.avatar || person.profilePhoto || person.signature) {
      add(relativePath, 'DISALLOWED_PERSONAL_FIELD_VALUE', row);
    }
    if (ids.has(person.id)) add(relativePath, 'DUPLICATE_PERSONNEL_ID', row);
    ids.add(person.id);
  }
}

const authSource = join(root, 'src', 'lib', 'staticAuth.ts');
if (!existsSync(authSource)) add('src/lib/staticAuth.ts', 'MISSING_STATIC_AUTH_BOUNDARY');
else {
  const text = readFileSync(authSource, 'utf8');
  if (!text.includes('isDemoLocalMode()')) add('src/lib/staticAuth.ts', 'STATIC_AUTH_NOT_DEMO_GUARDED');
}

const seedSource = join(root, 'server', 'prisma', 'seed.ts');
if (existsSync(seedSource)) {
  const text = readFileSync(seedSource, 'utf8');
  if (!text.includes("process.env.NODE_ENV === 'production'")) add('server/prisma/seed.ts', 'SEED_NOT_PRODUCTION_BLOCKED');
  if (!text.includes("ALLOW_SYNTHETIC_SEED !== 'true'")) add('server/prisma/seed.ts', 'SEED_NOT_EXPLICITLY_GATED');
}

for (const file of Object.keys(allowlist)) {
  if (!existsSync(join(root, file))) add(file, 'ALLOWLIST_FILE_MISSING');
}

const result = {
  root,
  scanned,
  findings: findings.sort((left, right) => left.file.localeCompare(right.file) || left.kind.localeCompare(right.kind)),
  findingCount: findings.length,
  verdict: findings.length === 0 ? 'PASS' : 'FAIL',
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = findings.length === 0 ? 0 : 1;

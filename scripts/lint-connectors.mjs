import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const repoRoot = process.cwd();
const venueRoot = join(repoRoot, "connectors");

const bannedPatterns = [
  { pattern: /from\s+["']@nestjs\//, reason: "connector packages must not import server frameworks" },
  { pattern: /from\s+["'](?:apps|libs)\//, reason: "connector packages must not import application internals" },
  { pattern: /from\s+["'](?:kafkajs|@prisma\/client|alchemy-sdk)["']/, reason: "connector packages must not import runtime infrastructure clients" },
  { pattern: /\bprocess\.env\b/, reason: "declare runtime requirements in the manifest" },
  { pattern: /\bnew\s+PrismaClient\b/, reason: "venue packages must not access the database" }
];

const failures = [];

for (const file of await listFiles(venueRoot)) {
  if (!file.endsWith(".ts")) {
    continue;
  }

  const source = await readFile(file, "utf8");
  for (const banned of bannedPatterns) {
    if (banned.pattern.test(source)) {
      failures.push(`${relative(repoRoot, file)}: ${banned.reason}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Connector lint failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Connector lint passed");
}

async function listFiles(dir) {
  const entries = await readdir(dir);
  const files = [];

  for (const entry of entries) {
    if (entry === "node_modules" || entry === "dist" || entry === ".turbo" || entry === "generated") {
      continue;
    }

    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

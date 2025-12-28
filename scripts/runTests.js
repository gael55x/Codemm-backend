/* eslint-disable no-console */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function listTestFiles(kind) {
  const root = path.join(__dirname, "..", "test");
  const bases =
    kind === "all"
      ? [path.join(root, "unit"), path.join(root, "integration")]
      : [path.join(root, kind)];

  const files = [];
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    files.push(...walk(base));
  }

  return files.filter((p) => p.endsWith(".test.js")).sort((a, b) => a.localeCompare(b));
}

function main(argv) {
  const kind = argv[2];
  if (!kind || (kind !== "unit" && kind !== "integration" && kind !== "all")) {
    console.error("Usage: node scripts/runTests.js <all|unit|integration>");
    return 2;
  }

  const files = listTestFiles(kind);
  if (files.length === 0) {
    console.error(`No ${kind} test files found.`);
    return 1;
  }

  const nodeArgs = ["--test", ...files];
  const res = spawnSync(process.execPath, nodeArgs, { stdio: "inherit" });
  return res.status ?? 1;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { listTestFiles, main };

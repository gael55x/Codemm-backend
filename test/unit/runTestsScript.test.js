require("../helpers/setupBase");

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { listTestFiles } = require("../../scripts/runTests");

test("runTests: lists only .test.js files for unit", () => {
  const files = listTestFiles("unit");
  assert.ok(Array.isArray(files));
  assert.ok(files.length > 0);
  for (const f of files) {
    assert.ok(f.endsWith(".test.js"));
    assert.equal(f.includes(`${path.sep}helpers${path.sep}`), false);
    assert.equal(f.includes(`${path.sep}integration${path.sep}`), false);
  }
});

test("runTests: lists unit+integration when kind=all", () => {
  const files = listTestFiles("all");
  assert.ok(files.some((f) => f.includes(`${path.sep}unit${path.sep}`)));
  assert.ok(files.some((f) => f.includes(`${path.sep}integration${path.sep}`)));
});


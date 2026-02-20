#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const target = path.resolve(__dirname, "..", "dist", "index.js");

if (!fs.existsSync(target)) {
  process.exit(0);
}

try {
  fs.chmodSync(target, 0o755);
} catch {
  // Non-POSIX environments may ignore executable bit changes.
}

#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function rm(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

const root = path.resolve(__dirname, "..");
rm(path.join(root, "dist"));


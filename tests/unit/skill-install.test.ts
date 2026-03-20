import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  getCodexBinDir,
  getCodexToolDir,
  getInstalledCliDistDir,
  getInstalledCliEntry,
  getInstalledCliNodeModulesDir,
  getInstalledCliShim,
  getTargetSkillDir,
  pathContainsDir,
  renderCliShim,
  resolveCodexHome,
} from "../../src/lib/skill-install";

describe("skill install helpers", () => {
  it("resolves codex home from explicit arg before env", () => {
    const resolved = resolveCodexHome("./custom-codex", "/tmp/from-env");
    expect(resolved).toBe(path.resolve("./custom-codex"));
  });

  it("falls back to env when explicit arg is missing", () => {
    const resolved = resolveCodexHome(undefined, "/tmp/from-env");
    expect(resolved).toBe(path.resolve("/tmp/from-env"));
  });

  it("derives stable install paths under codex home", () => {
    const codexHome = "/tmp/codex";

    expect(getTargetSkillDir(codexHome)).toBe("/tmp/codex/skills/sevdesk-agent-cli");
    expect(getCodexBinDir(codexHome)).toBe("/tmp/codex/bin");
    expect(getCodexToolDir(codexHome)).toBe("/tmp/codex/tools/sevdesk-agent-cli");
    expect(getInstalledCliDistDir(codexHome)).toBe(
      "/tmp/codex/tools/sevdesk-agent-cli/dist"
    );
    expect(getInstalledCliNodeModulesDir(codexHome)).toBe(
      "/tmp/codex/tools/sevdesk-agent-cli/node_modules"
    );
    expect(getInstalledCliEntry(codexHome)).toBe(
      "/tmp/codex/tools/sevdesk-agent-cli/dist/index.js"
    );
    expect(getInstalledCliShim(codexHome)).toBe("/tmp/codex/bin/sevdesk-agent");
  });

  it("renders a runnable shim script", () => {
    const shim = renderCliShim("/tmp/codex/tools/sevdesk-agent-cli/dist/index.js");
    expect(shim).toContain("#!/usr/bin/env sh");
    expect(shim).toContain('NODE_BIN="${NODE_BIN:-node}"');
    expect(shim).toContain('exec "$NODE_BIN" "/tmp/codex/tools/sevdesk-agent-cli/dist/index.js" "$@"');
  });

  it("detects whether a bin dir is already on PATH", () => {
    const pathValue = ["/usr/local/bin", "/tmp/codex/bin", "/usr/bin"].join(path.delimiter);
    expect(pathContainsDir(pathValue, "/tmp/codex/bin")).toBe(true);
    expect(pathContainsDir(pathValue, "/tmp/codex/other")).toBe(false);
  });
});

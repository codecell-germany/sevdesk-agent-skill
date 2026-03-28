import os from "node:os";
import path from "node:path";

export function resolveCodexHome(explicit?: string, envValue?: string): string {
  if (explicit && explicit.trim()) return path.resolve(explicit.trim());
  if (envValue && envValue.trim()) return path.resolve(envValue.trim());
  return path.join(os.homedir(), ".codex");
}

export function getTargetSkillDir(codexHome: string): string {
  return path.join(codexHome, "skills", "sevdesk-agent-cli");
}

export function getCodexBinDir(codexHome: string): string {
  return path.join(codexHome, "bin");
}

export function getCodexToolDir(codexHome: string): string {
  return path.join(codexHome, "tools", "sevdesk-agent-cli");
}

export function getInstalledCliNodeModulesDir(codexHome: string): string {
  return path.join(getCodexToolDir(codexHome), "node_modules");
}

export function getInstalledCliDistDir(codexHome: string): string {
  return path.join(getCodexToolDir(codexHome), "dist");
}

export function getInstalledCliEntry(codexHome: string): string {
  return path.join(getInstalledCliDistDir(codexHome), "index.js");
}

export function getInstalledCliShim(codexHome: string): string {
  return path.join(getCodexBinDir(codexHome), "sevdesk-agent");
}

export function buildGlobalCliPackageSpec(packageName: string, version: string): string {
  const normalizedName = packageName.trim();
  const normalizedVersion = version.trim();
  return normalizedVersion ? `${normalizedName}@${normalizedVersion}` : normalizedName;
}

export function normalizeCliVersion(raw: string | undefined | null): string {
  return String(raw ?? "")
    .trim()
    .replace(/^v/i, "");
}

export function isInstalledCliVersion(
  actual: string | undefined | null,
  expected: string | undefined | null
): boolean {
  const normalizedActual = normalizeCliVersion(actual);
  const normalizedExpected = normalizeCliVersion(expected);
  return normalizedActual !== "" && normalizedActual === normalizedExpected;
}

export function getGlobalNpmBinDir(prefix: string): string {
  return process.platform === "win32" ? path.resolve(prefix) : path.join(path.resolve(prefix), "bin");
}

export function renderCliShim(entryPath: string): string {
  return [
    "#!/usr/bin/env sh",
    "set -eu",
    'NODE_BIN="${NODE_BIN:-node}"',
    `exec "$NODE_BIN" "${entryPath}" "$@"`,
    "",
  ].join("\n");
}

export function pathContainsDir(pathValue: string | undefined, dir: string): boolean {
  if (!pathValue) return false;
  const normalizedTarget = path.resolve(dir);
  return pathValue
    .split(path.delimiter)
    .map((item) => item.trim())
    .filter(Boolean)
    .some((item) => path.resolve(item) === normalizedTarget);
}

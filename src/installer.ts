#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { access, chmod, cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
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
} from "./lib/skill-install";

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function isNonEmptyDir(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    if (!s.isDirectory()) return false;
    const items = await readdir(p);
    return items.length > 0;
  } catch {
    return false;
  }
}

function getPackageRoot(): string {
  // dist/installer.js -> package root is one level up
  return path.resolve(__dirname, "..");
}

function getSourceSkillDir(): string {
  return path.join(getPackageRoot(), "skills", "sevdesk-agent-cli");
}

function readPackageVersion(): string {
  try {
    const pkgPath = path.join(getPackageRoot(), "package.json");
    const raw = readFileSync(pkgPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === "string" && parsed.version.trim() ? parsed.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function readProductionDependencyNames(): string[] {
  try {
    const pkgPath = path.join(getPackageRoot(), "package.json");
    const raw = readFileSync(pkgPath, "utf8");
    const parsed = JSON.parse(raw) as { dependencies?: Record<string, unknown> };
    return Object.keys(parsed.dependencies ?? {});
  } catch {
    return [];
  }
}

function resolveInstalledDependencyDir(name: string): string {
  try {
    const entryPath = require.resolve(name, {
      paths: [getPackageRoot()],
    });
    let current = path.dirname(entryPath);
    while (true) {
      try {
        const raw = readFileSync(path.join(current, "package.json"), "utf8");
        const parsed = JSON.parse(raw) as { name?: unknown };
        if (parsed.name === name) {
          return current;
        }
      } catch {
        // Keep walking upwards until we hit the package root.
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  } catch {
    // fall through to conventional node_modules layout below
  }
  return path.join(getPackageRoot(), "node_modules", ...name.split("/"));
}

async function installSkill(opts: { codexHome?: string; force?: boolean; dryRun?: boolean }) {
  const codexHome = resolveCodexHome(opts.codexHome, process.env.CODEX_HOME);
  const src = getSourceSkillDir();
  const dst = getTargetSkillDir(codexHome);
  const runtimeSrc = path.join(getPackageRoot(), "dist");
  const runtimeDst = getInstalledCliDistDir(codexHome);
  const toolDir = getCodexToolDir(codexHome);
  const nodeModulesDst = getInstalledCliNodeModulesDir(codexHome);
  const binDir = getCodexBinDir(codexHome);
  const shimPath = getInstalledCliShim(codexHome);
  const dependencyNames = readProductionDependencyNames();
  const dependencySources = dependencyNames.map((name) => ({
    name,
    src: resolveInstalledDependencyDir(name),
    dst: path.join(nodeModulesDst, ...name.split("/")),
  }));

  if (!(await pathExists(src))) {
    throw new Error(`Skill payload not found in package: ${src}`);
  }
  if (!(await isNonEmptyDir(runtimeSrc))) {
    throw new Error(`CLI runtime not found in package: ${runtimeSrc}`);
  }
  for (const dependency of dependencySources) {
    if (!(await pathExists(dependency.src))) {
      throw new Error(`Required runtime dependency not found in package: ${dependency.src}`);
    }
  }

  const existingTargets = (
    await Promise.all([dst, runtimeDst, nodeModulesDst, shimPath].map(async (candidate) => ({
      candidate,
      exists: await pathExists(candidate),
    })))
  )
    .filter((item) => item.exists)
    .map((item) => item.candidate);

  if (existingTargets.length > 0) {
    if (!opts.force) {
      throw new Error(
        `Existing installation detected at ${existingTargets.join(", ")}. Re-run with --force to overwrite.`
      );
    }
  }

  const skillsDir = path.dirname(dst);

  if (opts.dryRun) {
    process.stdout.write(
      [
        "[sevdesk-agent-skill] DRY RUN",
        `Would ensure: ${skillsDir}`,
        `Would ensure: ${toolDir}`,
        `Would ensure: ${binDir}`,
        `Would ${opts.force ? "replace" : "create"}: ${dst}`,
        `From: ${src}`,
        `Would ${opts.force ? "replace" : "create"} runtime: ${runtimeDst}`,
        `From: ${runtimeSrc}`,
        `Would ${opts.force ? "replace" : "replace/install"} runtime deps: ${nodeModulesDst}`,
        ...dependencySources.map((dependency) => `  - ${dependency.name} <= ${dependency.src}`),
        `Would ${opts.force ? "replace" : "create"} CLI shim: ${shimPath}`,
        "",
      ].join("\n") + "\n"
    );
    return;
  }

  await mkdir(skillsDir, { recursive: true });
  await mkdir(toolDir, { recursive: true });
  await mkdir(binDir, { recursive: true });

  if (opts.force) {
    await rm(dst, { recursive: true, force: true });
    await rm(runtimeDst, { recursive: true, force: true });
    await rm(nodeModulesDst, { recursive: true, force: true });
    await rm(shimPath, { force: true });
  }

  await cp(src, dst, { recursive: true });
  await cp(runtimeSrc, runtimeDst, { recursive: true });
  for (const dependency of dependencySources) {
    await mkdir(path.dirname(dependency.dst), { recursive: true });
    await cp(dependency.src, dependency.dst, { recursive: true });
  }
  await writeFile(shimPath, renderCliShim(getInstalledCliEntry(codexHome)), "utf8");
  await chmod(shimPath, 0o755);

  process.stdout.write(
    [
      "[sevdesk-agent-skill] Installed:",
      `- ${dst}`,
      `- ${runtimeDst}`,
      `- ${nodeModulesDst}`,
      `- ${shimPath}`,
      "",
      "CLI usage:",
      `- ${shimPath} --help`,
      `- npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent --help`,
      pathContainsDir(process.env.PATH, binDir)
        ? "- `~/.codex/bin` is on PATH, so `sevdesk-agent ...` should work directly."
        : "- Optional: add `export PATH=\"$HOME/.codex/bin:$PATH\"` to your shell profile for plain `sevdesk-agent ...`.",
      "",
      "Next in Codex:",
      "- Select/use skill: sevdesk-agent-cli",
      "",
    ].join("\n") + "\n"
  );
}

async function uninstallSkill(opts: { codexHome?: string; dryRun?: boolean }) {
  const codexHome = resolveCodexHome(opts.codexHome, process.env.CODEX_HOME);
  const dst = getTargetSkillDir(codexHome);
  const runtimeDst = getInstalledCliDistDir(codexHome);
  const nodeModulesDst = getInstalledCliNodeModulesDir(codexHome);
  const shimPath = getInstalledCliShim(codexHome);

  if (
    !(await pathExists(dst)) &&
    !(await pathExists(runtimeDst)) &&
    !(await pathExists(nodeModulesDst)) &&
    !(await pathExists(shimPath))
  ) {
    process.stdout.write(
      `[sevdesk-agent-skill] Nothing installed under ${codexHome} for sevdesk-agent-cli\n`
    );
    return;
  }

  if (opts.dryRun) {
    process.stdout.write(
      [
        "[sevdesk-agent-skill] DRY RUN",
        `Would remove: ${dst}`,
        `Would remove: ${runtimeDst}`,
        `Would remove: ${nodeModulesDst}`,
        `Would remove: ${shimPath}`,
        "",
      ].join("\n") + "\n"
    );
    return;
  }

  await rm(dst, { recursive: true, force: true });
  await rm(runtimeDst, { recursive: true, force: true });
  await rm(nodeModulesDst, { recursive: true, force: true });
  await rm(shimPath, { force: true });
  process.stdout.write(
    [
      "[sevdesk-agent-skill] Removed:",
      `- ${dst}`,
      `- ${runtimeDst}`,
      `- ${nodeModulesDst}`,
      `- ${shimPath}`,
    ].join("\n") + "\n"
  );
}

async function doctor(opts: { codexHome?: string }) {
  const codexHome = resolveCodexHome(opts.codexHome, process.env.CODEX_HOME);
  const src = getSourceSkillDir();
  const dst = getTargetSkillDir(codexHome);
  const runtimeSrc = path.join(getPackageRoot(), "dist");
  const runtimeDst = getInstalledCliDistDir(codexHome);
  const nodeModulesDst = getInstalledCliNodeModulesDir(codexHome);
  const shimPath = getInstalledCliShim(codexHome);
  const binDir = getCodexBinDir(codexHome);
  const dependencyNames = readProductionDependencyNames();

  const checks: Array<{ ok: boolean; label: string }> = [];
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  checks.push({ ok: Number.isFinite(nodeMajor) && nodeMajor >= 20, label: "node >= 20" });
  checks.push({ ok: await pathExists(src), label: `payload exists (${src})` });
  checks.push({ ok: await pathExists(path.join(src, "SKILL.md")), label: "payload has SKILL.md" });
  checks.push({ ok: await isNonEmptyDir(runtimeSrc), label: `runtime exists (${runtimeSrc})` });
  checks.push({ ok: true, label: `codex home = ${codexHome}` });
  checks.push({
    ok: true,
    label: "codex home/skills, tools, and bin dirs will be created on install if missing",
  });
  checks.push({ ok: await pathExists(dst), label: `installed (${dst})` });
  checks.push({ ok: await isNonEmptyDir(runtimeDst), label: `runtime installed (${runtimeDst})` });
  checks.push({
    ok:
      dependencyNames.length === 0 ||
      (await pathExists(nodeModulesDst)),
    label: `runtime deps installed (${nodeModulesDst})`,
  });
  checks.push({ ok: await pathExists(shimPath), label: `CLI shim installed (${shimPath})` });
  checks.push({
    ok: pathContainsDir(process.env.PATH, binDir),
    label: `PATH contains ${binDir}`,
  });

  const lines = ["[sevdesk-agent-skill] doctor", ...checks.map((c) => `${c.ok ? "ok" : "no"}\t${c.label}`)];
  lines.push("");
  lines.push("Recommended CLI bootstrap:");
  lines.push("- npx -y -p @codecell-germany/sevdesk-agent-skill sevdesk-agent-skill install --force");
  lines.push(`- ${shimPath} --help`);
  process.stdout.write(`${lines.join("\n")}\n`);

  const failed = checks.some(
    (c) =>
      !c.ok &&
      (c.label.startsWith("payload") ||
        c.label.startsWith("runtime exists"))
  );
  if (failed) process.exitCode = 2;
}

const program = new Command();
program
  .name("sevdesk-agent-skill")
  .description("Install/remove the sevdesk-agent-cli skill for Codex (~/.codex/skills)")
  .version(readPackageVersion());

program
  .command("install")
  .description("Install the skill into Codex skills folder")
  .option("--codex-home <path>", "Override CODEX_HOME (default: ~/.codex)")
  .option("--force", "Overwrite existing installation", false)
  .option("--dry-run", "Print actions without writing", false)
  .action(async (opts) => {
    await installSkill({ codexHome: opts.codexHome, force: opts.force, dryRun: opts.dryRun });
  });

program
  .command("uninstall")
  .description("Remove the skill from Codex skills folder")
  .option("--codex-home <path>", "Override CODEX_HOME (default: ~/.codex)")
  .option("--dry-run", "Print actions without writing", false)
  .action(async (opts) => {
    await uninstallSkill({ codexHome: opts.codexHome, dryRun: opts.dryRun });
  });

program
  .command("doctor")
  .description("Print environment and installation diagnostics")
  .option("--codex-home <path>", "Override CODEX_HOME (default: ~/.codex)")
  .action(async (opts) => {
    await doctor({ codexHome: opts.codexHome });
  });

program.parseAsync(process.argv).catch((error) => {
  process.stderr.write(`[sevdesk-agent-skill] ${error.message}\n`);
  process.exitCode = 1;
});

// Copyright 2026 toshicloud
// SPDX-License-Identifier: Apache-2.0

// Build-time catalogue: validate packages.yaml and write .generated/catalogue.json.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const SOURCE = fileURLToPath(new URL("packages.yaml", import.meta.url));
const OUTPUT = fileURLToPath(new URL(".generated/catalogue.json", import.meta.url));
const SEGMENT = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;

function fail(where, message) {
  throw new Error(`${where}: ${message}`);
}

function isMapping(value) {
  return value instanceof Map;
}

function readHostname(root) {
  if (!root.has("url")) fail("url", 'is required: a bare hostname such as "go.example.com"');
  const value = root.get("url");
  if (typeof value !== "string" || value === "") fail("url", "must be a non-empty hostname");
  if (/\s/.test(value)) fail("url", "must not contain whitespace");
  const labels = value.split(".");
  if (labels.length < 2 || !labels.every((label) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
    fail("url", `must be a dotted hostname without a scheme, path, port or credentials, got "${value}"`);
  }
  let parsed;
  try {
    parsed = new URL(`https://${value}`);
  } catch {
    fail("url", `is not a valid hostname: "${value}"`);
  }
  if (parsed.hostname !== value) {
    fail("url", `must be a lower-case ASCII hostname, got "${value}" (did you mean "${parsed.hostname}"?)`);
  }
  return value;
}

function readRepository(value, where) {
  if (typeof value !== "string" || value === "") {
    fail(where, "is required: use host/path or https://host/path");
  }
  if (/\s/.test(value)) fail(where, "must not contain whitespace");
  if (value.includes("://") && !value.startsWith("https://")) fail(where, "must use https://");
  let parsed;
  try {
    parsed = new URL(value.startsWith("https://") ? value : `https://${value}`);
  } catch {
    fail(where, `is not a valid repository URL: "${value}"`);
  }
  if (parsed.username !== "" || parsed.password !== "") fail(where, "must not contain credentials");
  if (parsed.search !== "" || parsed.hash !== "") fail(where, "must not contain a query or fragment");
  if (parsed.pathname === "" || parsed.pathname === "/") {
    fail(where, "must include a repository path, for example github.com/owner/repo");
  }
  return parsed.href;
}

function readDescription(value, where) {
  if (typeof value !== "string") fail(where, "must be a string");
  return value;
}

function readDocumentation(value, where) {
  if (typeof value !== "string" || value === "") fail(where, "must be a non-empty URL");
  if (/\s/.test(value)) fail(where, "must not contain whitespace");
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(where, `is not a valid URL: "${value}"`);
  }
  if (parsed.protocol !== "https:") fail(where, "must use https://");
  if (parsed.username !== "" || parsed.password !== "") fail(where, "must not contain credentials");
  return parsed.href;
}

function readLabel(value, where) {
  if (typeof value !== "string" || value.trim() === "") fail(where, "must be a non-empty string");
  return value;
}

function readPackage(name, value, hostname) {
  const where = `packages.${name}`;
  if (typeof name !== "string" || !name.split("/").every((segment) => SEGMENT.test(segment))) {
    fail(`packages.${String(name)}`, "name must be slash-separated segments of letters, digits or [._-]");
  }
  if (!isMapping(value)) fail(where, "must be a mapping with a repo");
  if (!value.has("repo")) fail(`${where}.repo`, "is required");

  const repository = readRepository(value.get("repo"), `${where}.repo`);
  const description = value.has("description")
    ? readDescription(value.get("description"), `${where}.description`)
    : "";
  const hasDocumentation = value.has("documentation");
  const documentation = hasDocumentation
    ? readDocumentation(value.get("documentation"), `${where}.documentation`)
    : `https://pkg.go.dev/${hostname}/${name}`;
  const documentationLabel = value.has("documentationLabel")
    ? readLabel(value.get("documentationLabel"), `${where}.documentationLabel`)
    : hasDocumentation ? "Docs" : "pkg.go.dev";
  let prerelease = false;
  if (value.has("prerelease")) {
    if (typeof value.get("prerelease") !== "boolean") fail(`${where}.prerelease`, "must be true or false");
    prerelease = value.get("prerelease");
  }

  return {
    name,
    repository,
    description,
    documentation,
    documentationLabel,
    prerelease,
  };
}

async function main() {
  const source = await readFile(SOURCE, "utf8");
  // YAML's default uniqueKeys check rejects duplicate mapping keys.
  const root = parse(source, { mapAsMap: true });
  if (!isMapping(root)) fail("catalogue", "must be a mapping with url and packages");

  const hostname = readHostname(root);
  if (!root.has("packages")) fail("packages", "is required: a mapping of package names");
  const entries = root.get("packages");
  if (!isMapping(entries)) fail("packages", "must be a mapping of package names to details");

  const packages = [...entries].map(([name, value]) => readPackage(name, value, hostname));
  const catalogue = { hostname, packages };

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(catalogue, null, 2)}\n`);
  console.log(`build.mjs: wrote ${packages.length} package(s) to .generated/catalogue.json`);
}

try {
  await main();
} catch (error) {
  console.error(`build.mjs: ${error.message}`);
  process.exitCode = 1;
}

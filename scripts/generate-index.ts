import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MAXIMUM_EXTENSION_SOURCE_SIZE,
  REPOSITORY_SCHEMA_VERSION,
  validateManifest,
  validateRepositoryIndex,
  type ExtensionManifest,
  type ExtensionRepositoryEntry,
  type ExtensionRepositoryIndex,
} from "@yomu/extension-kit";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const extensionsRoot = path.join(repositoryRoot, "extensions");
const extensionDirectories = (await readdir(extensionsRoot, {
  withFileTypes: true,
}))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const entries = await Promise.all(
  extensionDirectories.map(async (directory) => buildEntry(directory)),
);
const index: ExtensionRepositoryIndex = {
  schemaVersion: REPOSITORY_SCHEMA_VERSION,
  extensions: entries,
};

validateRepositoryIndex(index);

const outputDirectory = path.join(repositoryRoot, "dist");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, "index.json"),
  `${JSON.stringify(index, null, 2)}\n`,
  "utf8",
);

console.info(`Generated repository index with ${String(entries.length)} extension.`);

async function buildEntry(directory: string): Promise<ExtensionRepositoryEntry> {
  const extensionRoot = path.join(extensionsRoot, directory);
  const manifest = await readManifest(
    path.join(extensionRoot, "manifest.json"),
  );
  await stat(path.resolve(repositoryRoot, manifest.entrypoint));

  const artifactPath = path.resolve(repositoryRoot, manifest.artifactPath);
  const source = await readFile(artifactPath);
  if (source.byteLength === 0) {
    throw new Error(`Extension "${manifest.identifier}" produced an empty artifact.`);
  }
  if (source.byteLength > MAXIMUM_EXTENSION_SOURCE_SIZE) {
    throw new Error(
      `Extension "${manifest.identifier}" exceeds the ${String(MAXIMUM_EXTENSION_SOURCE_SIZE)} byte limit.`,
    );
  }

  return {
    identifier: manifest.identifier,
    name: manifest.name,
    version: manifest.version,
    contractVersion: manifest.contractVersion,
    language: manifest.language,
    iconURL: manifest.iconURL,
    downloadURL: manifest.downloadURL,
    sha256: createHash("sha256").update(source).digest("hex"),
    sourceSize: source.byteLength,
  };
}

async function readManifest(manifestPath: string): Promise<ExtensionManifest> {
  const serializedManifest = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(serializedManifest) as unknown;
  validateManifest(manifest);
  return manifest;
}

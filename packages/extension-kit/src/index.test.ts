import { describe, expect, it } from "vitest";
import {
  REPOSITORY_SCHEMA_VERSION,
  validateExtension,
  validateMetadata,
  validateRepositoryIndex,
} from "./index.ts";

const validMetadata = {
  identifier: "io.kodari.yomu.test",
  name: "Test Extension",
  version: "1.0.0",
  contractVersion: 1,
  language: "en",
};

describe("extension contract validation", (): void => {
  it("accepts valid metadata", (): void => {
    expect(() => {
      validateMetadata(validMetadata);
    }).not.toThrow();
  });

  it("rejects unsupported contract versions", (): void => {
    expect(() => {
      validateMetadata({ ...validMetadata, contractVersion: 2 });
    }).toThrow('Field "contractVersion" must equal 1.');
  });

  it("rejects missing contract methods", (): void => {
    expect(() => {
      validateExtension({
        metadata: validMetadata,
        getPopular: () => Promise.resolve({ items: [], hasNextPage: false }),
      });
    }).toThrow('Extension method "getSearch" is required.');
  });

  it("rejects duplicate repository identifiers", (): void => {
    const entry = {
      ...validMetadata,
      iconURL: "https://example.com/icon.svg",
      downloadURL: "https://example.com/extension.js",
      sha256: "a".repeat(64),
      sourceSize: 100,
    };

    expect(() => {
      validateRepositoryIndex({
        schemaVersion: REPOSITORY_SCHEMA_VERSION,
        extensions: [entry, entry],
      });
    }).toThrow('Duplicate extension identifier "io.kodari.yomu.test".');
  });
});

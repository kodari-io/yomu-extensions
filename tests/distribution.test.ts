import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  validateExtension,
  validateRepositoryIndex,
  type YomuExtension,
} from "@yomu/extension-kit";

const indexPath = new URL("../dist/index.json", import.meta.url);

interface ExtensionExpectation {
  readonly identifier: string;
  readonly artifactFileName: string;
  readonly assert: (extension: YomuExtension) => Promise<void>;
}

const EXPECTATIONS: readonly ExtensionExpectation[] = [
  {
    identifier: "io.kodari.yomu.reference",
    artifactFileName: "reference.js",
    assert: async (extension): Promise<void> => {
      const popular = await extension.getPopular({ page: 1 });
      const search = await extension.getSearch({ query: "midnight", page: 1 });
      const details = await extension.getMangaDetails({
        seriesIdentifier: "the-glass-orchard",
      });
      const pages = await extension.getChapterPages({
        chapterIdentifier: "the-glass-orchard-1",
      });

      expect(popular.items[0]?.identifier).toBe("the-glass-orchard");
      expect(search.items[0]?.identifier).toBe("midnight-archive");
      expect(details.chapters).toHaveLength(2);
      expect(pages.pageURLs).toHaveLength(2);
    },
  },
  {
    identifier: "io.kodari.yomu.olympusxyz",
    artifactFileName: "olympusxyz.js",
    assert: (extension): Promise<void> => {
      expect(typeof extension.getPopular).toBe("function");
      expect(typeof extension.getSearch).toBe("function");
      expect(typeof extension.getMangaDetails).toBe("function");
      expect(typeof extension.getChapterPages).toBe("function");
      return Promise.resolve();
    },
  },
];

describe("distribution artifacts", (): void => {
  it.each(EXPECTATIONS)(
    "loads the compiled $identifier extension and exposes every contract method",
    async ({ artifactFileName, assert }): Promise<void> => {
      const artifactPath = new URL(`../dist/extensions/${artifactFileName}`, import.meta.url);
      const source = await readFile(artifactPath, "utf8");
      const context: Record<string, unknown> = {};
      runInNewContext(source, context);
      validateExtension(context.yomuExtension);

      await assert(context.yomuExtension);
    },
  );

  it("publishes an index matching every compiled artifact", async (): Promise<void> => {
    const serializedIndex = await readFile(indexPath, "utf8");
    const index = JSON.parse(serializedIndex) as unknown;
    validateRepositoryIndex(index);

    for (const entry of index.extensions) {
      const expectation = EXPECTATIONS.find(({ identifier }) => identifier === entry.identifier);
      if (expectation === undefined) {
        throw new Error(`No test expectation registered for extension "${entry.identifier}".`);
      }

      const artifactPath = new URL(
        `../dist/extensions/${expectation.artifactFileName}`,
        import.meta.url,
      );
      const source = await readFile(artifactPath);
      expect(entry.sourceSize).toBe(source.byteLength);
      expect(entry.sha256).toBe(createHash("sha256").update(source).digest("hex"));
    }
  });
});

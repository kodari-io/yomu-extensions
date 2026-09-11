import { describe, expect, it } from "vitest";
import { validateExtension } from "@yomu/extension-kit";
import { referenceExtension } from "./index.ts";

describe("Yomu reference extension", (): void => {
  it("conforms to the versioned extension contract", (): void => {
    expect(() => {
      validateExtension(referenceExtension);
    }).not.toThrow();
  });

  it("returns deterministic paginated popular results", async (): Promise<void> => {
    const firstPage = await referenceExtension.getPopular({ page: 1 });
    const secondPage = await referenceExtension.getPopular({ page: 2 });

    expect(firstPage.items.map(({ identifier }) => identifier)).toEqual([
      "the-glass-orchard",
    ]);
    expect(firstPage.hasNextPage).toBe(true);
    expect(secondPage.items.map(({ identifier }) => identifier)).toEqual([
      "midnight-archive",
    ]);
    expect(secondPage.hasNextPage).toBe(false);
  });

  it("searches the fixture catalog without network access", async (): Promise<void> => {
    const result = await referenceExtension.getSearch({
      query: "MIDNIGHT",
      page: 1,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.identifier).toBe("midnight-archive");
  });

  it("returns series details and chapter pages", async (): Promise<void> => {
    const details = await referenceExtension.getMangaDetails({
      seriesIdentifier: "the-glass-orchard",
    });
    const pages = await referenceExtension.getChapterPages({
      chapterIdentifier: "the-glass-orchard-1",
    });

    expect(details.chapters).toHaveLength(2);
    expect(pages.pageURLs).toHaveLength(2);
  });

  it("rejects unknown series and chapters", async (): Promise<void> => {
    await expect(
      referenceExtension.getMangaDetails({ seriesIdentifier: "unknown" }),
    ).rejects.toThrow('Series "unknown" was not found.');
    await expect(
      referenceExtension.getChapterPages({ chapterIdentifier: "unknown" }),
    ).rejects.toThrow('Chapter "unknown" was not found.');
  });
});

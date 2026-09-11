import type {
  ExtensionChapterPages,
  ExtensionPage,
  ExtensionSeries,
  MangaDetailsInput,
  PopularInput,
  SearchInput,
  ChapterPagesInput,
  YomuExtension,
} from "@yomu/extension-kit";
import { REFERENCE_CATALOG } from "./catalog.ts";

const PAGE_SIZE = 1;

export const referenceExtension: YomuExtension = {
  metadata: {
    identifier: "io.kodari.yomu.reference",
    name: "Yomu Reference",
    version: "1.0.0",
    contractVersion: 1,
    language: "en",
  },

  async getPopular(input: PopularInput): Promise<ExtensionPage<ExtensionSeries>> {
    return Promise.resolve(toPage(REFERENCE_CATALOG, input.page));
  },

  async getSearch(input: SearchInput): Promise<ExtensionPage<ExtensionSeries>> {
    const query = input.query.trim().toLocaleLowerCase("en");
    const matches = REFERENCE_CATALOG.filter(({ details }) =>
      details.title.toLocaleLowerCase("en").includes(query),
    );
    return Promise.resolve(toPage(matches, input.page));
  },

  async getMangaDetails(input: MangaDetailsInput) {
    const entry = REFERENCE_CATALOG.find(
      ({ details }) => details.identifier === input.seriesIdentifier,
    );
    if (entry === undefined) {
      throw new Error(`Series "${input.seriesIdentifier}" was not found.`);
    }
    return Promise.resolve(entry.details);
  },

  async getChapterPages(
    input: ChapterPagesInput,
  ): Promise<ExtensionChapterPages> {
    for (const entry of REFERENCE_CATALOG) {
      const pages = entry.pagesByChapter[input.chapterIdentifier];
      if (pages !== undefined) {
        return Promise.resolve(pages);
      }
    }
    throw new Error(`Chapter "${input.chapterIdentifier}" was not found.`);
  },
};

globalThis.yomuExtension = referenceExtension;

function toPage(
  entries: typeof REFERENCE_CATALOG,
  requestedPage: number,
): ExtensionPage<ExtensionSeries> {
  const page = normalizePage(requestedPage);
  const offset = (page - 1) * PAGE_SIZE;
  return {
    items: entries.slice(offset, offset + PAGE_SIZE).map(({ details }) => ({
      identifier: details.identifier,
      title: details.title,
      artworkURL: details.artworkURL,
    })),
    hasNextPage: offset + PAGE_SIZE < entries.length,
  };
}

function normalizePage(page: number): number {
  return Number.isInteger(page) && page > 0 ? page : 1;
}

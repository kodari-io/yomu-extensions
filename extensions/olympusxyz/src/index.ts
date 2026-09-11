import type {
  ChapterPagesInput,
  ExtensionChapterPages,
  ExtensionPage,
  ExtensionSeries,
  ExtensionSeriesDetails,
  MangaDetailsInput,
  PopularInput,
  SearchInput,
  YomuExtension,
} from "@yomu/extension-kit";
import {
  fetchAllChapters,
  fetchChapterPages,
  fetchNewChapters,
  fetchSeriesDetail,
  fetchSeriesList,
} from "./client.ts";
import {
  decodeChapterIdentifier,
  decodeSeriesIdentifier,
  encodeChapterIdentifier,
  encodeSeriesIdentifier,
} from "./identifiers.ts";

const SEARCH_PAGE_SIZE = 20;

export const olympusxyzExtension: YomuExtension = {
  metadata: {
    identifier: "io.kodari.yomu.olympusxyz",
    name: "Olympus Scans",
    version: "1.0.0",
    contractVersion: 1,
    language: "es",
  },

  async getPopular(input: PopularInput): Promise<ExtensionPage<ExtensionSeries>> {
    const page = normalizePage(input.page);
    const response = await fetchNewChapters(page);
    return {
      items: response.data.map((item) => ({
        identifier: encodeSeriesIdentifier(item.type, item.slug),
        title: item.name,
        artworkURL: item.cover,
      })),
      hasNextPage: response.current_page < response.last_page,
    };
  },

  async getSearch(input: SearchInput): Promise<ExtensionPage<ExtensionSeries>> {
    const query = input.query.trim().toLocaleLowerCase("es");
    const response = await fetchSeriesList();
    const matches =
      query.length === 0
        ? response.data
        : response.data.filter((item) => item.name.toLocaleLowerCase("es").includes(query));

    const page = normalizePage(input.page);
    const offset = (page - 1) * SEARCH_PAGE_SIZE;
    return {
      items: matches.slice(offset, offset + SEARCH_PAGE_SIZE).map((item) => ({
        identifier: encodeSeriesIdentifier(item.type, item.slug),
        title: item.name,
        artworkURL: item.cover,
      })),
      hasNextPage: offset + SEARCH_PAGE_SIZE < matches.length,
    };
  },

  async getMangaDetails(input: MangaDetailsInput): Promise<ExtensionSeriesDetails> {
    const { type, slug } = decodeSeriesIdentifier(input.seriesIdentifier);
    const [detail, chapters] = await Promise.all([
      fetchSeriesDetail(type, slug),
      fetchAllChapters(type, slug),
    ]);

    return {
      identifier: input.seriesIdentifier,
      title: detail.data.name,
      author: null,
      synopsis: detail.data.summary,
      artworkURL: detail.data.cover,
      chapters: chapters.map((chapter) => ({
        identifier: encodeChapterIdentifier(type, slug, chapter.id),
        title: chapter.name,
        number: parseChapterNumber(chapter.name),
        publishedAt: chapter.published_at,
      })),
    };
  },

  async getChapterPages(input: ChapterPagesInput): Promise<ExtensionChapterPages> {
    const { type, slug, chapterId } = decodeChapterIdentifier(input.chapterIdentifier);
    const pageURLs = await fetchChapterPages(type, slug, chapterId);
    return {
      chapterIdentifier: input.chapterIdentifier,
      pageURLs,
    };
  },
};

globalThis.yomuExtension = olympusxyzExtension;

function normalizePage(page: number): number {
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseChapterNumber(name: string): number | null {
  const value = Number.parseFloat(name);
  return Number.isFinite(value) ? value : null;
}

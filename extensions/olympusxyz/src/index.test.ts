import { beforeEach, describe, expect, it, vi } from "vitest";
import type { YomuFetchRequest, YomuFetchResponse } from "@yomu/extension-kit";
import { validateExtension } from "@yomu/extension-kit";
import { olympusxyzExtension } from "./index.ts";

const NEW_CHAPTERS_PAGE_1 = {
  current_page: 1,
  last_page: 2,
  data: [
    {
      id: 1,
      name: "Test Series",
      slug: "test-series",
      cover: "https://media.example.com/test-series/cover.webp",
      type: "comic",
    },
  ],
};

const SERIES_LIST = {
  data: [
    {
      id: 1,
      name: "Test Series",
      slug: "test-series",
      cover: "https://media.example.com/test-series/cover.webp",
      type: "comic",
    },
    {
      id: 2,
      name: "Another Novel",
      slug: "another-novel",
      cover: "https://media.example.com/another-novel/cover.webp",
      type: "novel",
    },
  ],
};

const SERIES_DETAIL = {
  data: {
    name: "Test Series",
    summary: "A deterministic fixture series.",
    cover: "https://media.example.com/test-series/cover.webp",
  },
};

const CHAPTERS_PAGE_1 = {
  data: [{ id: 502, name: "2", published_at: "2026-01-08T00:00:00.000000Z" }],
  meta: { current_page: 1, last_page: 2 },
};

const CHAPTERS_PAGE_2 = {
  data: [{ id: 501, name: "1", published_at: "2026-01-01T00:00:00.000000Z" }],
  meta: { current_page: 2, last_page: 2 },
};

const CHAPTER_PAGES = {
  chapter: {
    pages: [
      "https://media.example.com/test-series/501/page-1.webp",
      "https://media.example.com/test-series/501/page-2.webp",
    ],
  },
};

function jsonResponse(body: unknown): YomuFetchResponse {
  return {
    status: 200,
    headers: {},
    text: (): string => JSON.stringify(body),
    json: (): unknown => body,
  };
}

const fetchMock = vi.fn(
  ({ url }: YomuFetchRequest): Promise<YomuFetchResponse> => {
    if (url === "https://olympusxyz.com/api/new-chapters?page=1") {
      return Promise.resolve(jsonResponse(NEW_CHAPTERS_PAGE_1));
    }
    if (url === "https://olympusxyz.com/api/series/list") {
      return Promise.resolve(jsonResponse(SERIES_LIST));
    }
    if (url === "https://olympusxyz.com/api/series/test-series?type=comic") {
      return Promise.resolve(jsonResponse(SERIES_DETAIL));
    }
    if (
      url ===
      "https://panel.olympusxyz.com/api/series/test-series/chapters?page=1&direction=desc&type=comic"
    ) {
      return Promise.resolve(jsonResponse(CHAPTERS_PAGE_1));
    }
    if (
      url ===
      "https://panel.olympusxyz.com/api/series/test-series/chapters?page=2&direction=desc&type=comic"
    ) {
      return Promise.resolve(jsonResponse(CHAPTERS_PAGE_2));
    }
    if (url === "https://olympusxyz.com/api/capitulo/test-series/501?type=comic") {
      return Promise.resolve(jsonResponse(CHAPTER_PAGES));
    }
    throw new Error(`Unexpected fetch to "${url}" in test.`);
  },
);

beforeEach((): void => {
  fetchMock.mockClear();
  globalThis.yomu = {
    fetch: fetchMock,
    storage: {
      get: (): Promise<string | null> => Promise.resolve(null),
      set: (): Promise<boolean> => Promise.resolve(true),
      remove: (): Promise<boolean> => Promise.resolve(true),
    },
    log: {
      debug: (): Promise<boolean> => Promise.resolve(true),
      info: (): Promise<boolean> => Promise.resolve(true),
      error: (): Promise<boolean> => Promise.resolve(true),
    },
  };
});

describe("Olympus Scans extension", (): void => {
  it("conforms to the versioned extension contract", (): void => {
    expect(() => {
      validateExtension(olympusxyzExtension);
    }).not.toThrow();
  });

  it("maps the new-chapters feed into popular results", async (): Promise<void> => {
    const result = await olympusxyzExtension.getPopular({ page: 1 });

    expect(result.items).toEqual([
      {
        identifier: "comic:test-series",
        title: "Test Series",
        artworkURL: "https://media.example.com/test-series/cover.webp",
      },
    ]);
    expect(result.hasNextPage).toBe(true);
  });

  it("searches and paginates the full series catalog", async (): Promise<void> => {
    const result = await olympusxyzExtension.getSearch({ query: "novel", page: 1 });

    expect(result.items).toEqual([
      {
        identifier: "novel:another-novel",
        title: "Another Novel",
        artworkURL: "https://media.example.com/another-novel/cover.webp",
      },
    ]);
    expect(result.hasNextPage).toBe(false);
  });

  it("fetches series details across paginated chapter lists", async (): Promise<void> => {
    const details = await olympusxyzExtension.getMangaDetails({
      seriesIdentifier: "comic:test-series",
    });

    expect(details.title).toBe("Test Series");
    expect(details.author).toBeNull();
    expect(details.synopsis).toBe("A deterministic fixture series.");
    expect(details.chapters).toEqual([
      {
        identifier: "comic:test-series:502",
        title: "2",
        number: 2,
        publishedAt: "2026-01-08T00:00:00.000000Z",
      },
      {
        identifier: "comic:test-series:501",
        title: "1",
        number: 1,
        publishedAt: "2026-01-01T00:00:00.000000Z",
      },
    ]);
  });

  it("fetches chapter page URLs", async (): Promise<void> => {
    const pages = await olympusxyzExtension.getChapterPages({
      chapterIdentifier: "comic:test-series:501",
    });

    expect(pages).toEqual({
      chapterIdentifier: "comic:test-series:501",
      pageURLs: CHAPTER_PAGES.chapter.pages,
    });
  });

  it("rejects a request that fails at the origin", async (): Promise<void> => {
    fetchMock.mockImplementationOnce(
      (): Promise<YomuFetchResponse> =>
        Promise.resolve({ ...jsonResponse({ message: "Not Found" }), status: 404 }),
    );

    await expect(
      olympusxyzExtension.getChapterPages({ chapterIdentifier: "comic:missing-series:999" }),
    ).rejects.toThrow();
  });
});

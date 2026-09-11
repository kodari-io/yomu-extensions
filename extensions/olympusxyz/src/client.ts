import type { OlympusSeriesType } from "./identifiers.ts";

const SITE_ORIGIN = "https://olympusxyz.com";
const PANEL_ORIGIN = "https://panel.olympusxyz.com";

export interface OlympusSeriesListItem {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly cover: string;
  readonly type: OlympusSeriesType;
}

interface OlympusSeriesListResponse {
  readonly data: readonly OlympusSeriesListItem[];
}

export interface OlympusChapterSummary {
  readonly id: number;
  readonly name: string;
  readonly published_at: string | null;
}

interface OlympusNewChaptersItem {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly cover: string;
  readonly type: OlympusSeriesType;
}

interface OlympusNewChaptersResponse {
  readonly current_page: number;
  readonly last_page: number;
  readonly data: readonly OlympusNewChaptersItem[];
}

interface OlympusSeriesDetailResponse {
  readonly data: {
    readonly name: string;
    readonly summary: string | null;
    readonly cover: string;
  };
}

interface OlympusChapterListResponse {
  readonly data: readonly OlympusChapterSummary[];
  readonly meta: {
    readonly current_page: number;
    readonly last_page: number;
  };
}

interface OlympusChapterPagesResponse {
  readonly chapter: {
    readonly pages: readonly string[];
  };
}

export async function fetchNewChapters(page: number): Promise<OlympusNewChaptersResponse> {
  return fetchJSON<OlympusNewChaptersResponse>(
    `${SITE_ORIGIN}/api/new-chapters?page=${String(page)}`,
  );
}

export async function fetchSeriesList(): Promise<OlympusSeriesListResponse> {
  return fetchJSON<OlympusSeriesListResponse>(`${SITE_ORIGIN}/api/series/list`);
}

export async function fetchSeriesDetail(
  type: OlympusSeriesType,
  slug: string,
): Promise<OlympusSeriesDetailResponse> {
  return fetchJSON<OlympusSeriesDetailResponse>(
    `${SITE_ORIGIN}/api/series/${slug}?type=${type}`,
  );
}

export async function fetchAllChapters(
  type: OlympusSeriesType,
  slug: string,
): Promise<OlympusChapterSummary[]> {
  const chapters: OlympusChapterSummary[] = [];
  let page = 1;

  for (;;) {
    const response = await fetchJSON<OlympusChapterListResponse>(
      `${PANEL_ORIGIN}/api/series/${slug}/chapters?page=${String(page)}&direction=desc&type=${type}`,
    );
    chapters.push(...response.data);

    if (response.meta.current_page >= response.meta.last_page) {
      return chapters;
    }
    page += 1;
  }
}

export async function fetchChapterPages(
  type: OlympusSeriesType,
  slug: string,
  chapterId: number,
): Promise<readonly string[]> {
  const response = await fetchJSON<OlympusChapterPagesResponse>(
    `${SITE_ORIGIN}/api/capitulo/${slug}/${String(chapterId)}?type=${type}`,
  );
  return response.chapter.pages;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await yomu.fetch({
    url,
    headers: { accept: "application/json" },
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Olympus Scans request to "${url}" failed with status ${String(response.status)}.`);
  }
  return response.json() as T;
}

import type {
  ExtensionChapterPages,
  ExtensionSeriesDetails,
} from "@yomu/extension-kit";

export interface ReferenceCatalogEntry {
  readonly details: ExtensionSeriesDetails;
  readonly pagesByChapter: Readonly<Record<string, ExtensionChapterPages>>;
}

export const REFERENCE_CATALOG: readonly ReferenceCatalogEntry[] = [
  {
    details: {
      identifier: "the-glass-orchard",
      title: "The Glass Orchard",
      author: "Yomu Test Studio",
      synopsis: "A deterministic fixture series used to verify the extension contract.",
      artworkURL: "https://example.com/yomu/reference/the-glass-orchard/cover.jpg",
      chapters: [
        {
          identifier: "the-glass-orchard-1",
          title: "Chapter 1",
          number: 1,
          publishedAt: "2026-01-05T12:00:00Z",
        },
        {
          identifier: "the-glass-orchard-2",
          title: "Chapter 2",
          number: 2,
          publishedAt: "2026-01-12T12:00:00Z",
        },
      ],
    },
    pagesByChapter: {
      "the-glass-orchard-1": {
        chapterIdentifier: "the-glass-orchard-1",
        pageURLs: [
          "https://example.com/yomu/reference/the-glass-orchard/chapter-1/page-1.jpg",
          "https://example.com/yomu/reference/the-glass-orchard/chapter-1/page-2.jpg",
        ],
      },
      "the-glass-orchard-2": {
        chapterIdentifier: "the-glass-orchard-2",
        pageURLs: [
          "https://example.com/yomu/reference/the-glass-orchard/chapter-2/page-1.jpg",
        ],
      },
    },
  },
  {
    details: {
      identifier: "midnight-archive",
      title: "Midnight Archive",
      author: null,
      synopsis: "A second fixture series for deterministic search and pagination.",
      artworkURL: "https://example.com/yomu/reference/midnight-archive/cover.jpg",
      chapters: [
        {
          identifier: "midnight-archive-1",
          title: "Chapter 1",
          number: 1,
          publishedAt: null,
        },
      ],
    },
    pagesByChapter: {
      "midnight-archive-1": {
        chapterIdentifier: "midnight-archive-1",
        pageURLs: [
          "https://example.com/yomu/reference/midnight-archive/chapter-1/page-1.jpg",
        ],
      },
    },
  },
];

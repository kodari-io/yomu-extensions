export const YOMU_CONTRACT_VERSION = 1;
export const MAXIMUM_EXTENSION_SOURCE_SIZE = 2_000_000;
export const REPOSITORY_SCHEMA_VERSION = 1;

export interface ExtensionMetadata {
  readonly identifier: string;
  readonly name: string;
  readonly version: string;
  readonly contractVersion: number;
  readonly language: string;
}

export interface ExtensionSeries {
  readonly identifier: string;
  readonly title: string;
  readonly artworkURL: string | null;
}

export interface ExtensionPage<Item> {
  readonly items: readonly Item[];
  readonly hasNextPage: boolean;
}

export interface ExtensionChapter {
  readonly identifier: string;
  readonly title: string;
  readonly number: number | null;
  readonly publishedAt: string | null;
}

export interface ExtensionSeriesDetails {
  readonly identifier: string;
  readonly title: string;
  readonly author: string | null;
  readonly synopsis: string | null;
  readonly artworkURL: string | null;
  readonly chapters: readonly ExtensionChapter[];
}

export interface ExtensionChapterPages {
  readonly chapterIdentifier: string;
  readonly pageURLs: readonly string[];
}

export interface PopularInput {
  readonly page: number;
}

export interface SearchInput {
  readonly query: string;
  readonly page: number;
}

export interface MangaDetailsInput {
  readonly seriesIdentifier: string;
}

export interface ChapterPagesInput {
  readonly chapterIdentifier: string;
}

export interface YomuExtension {
  readonly metadata: ExtensionMetadata;
  getPopular(input: PopularInput): Promise<ExtensionPage<ExtensionSeries>>;
  getSearch(input: SearchInput): Promise<ExtensionPage<ExtensionSeries>>;
  getMangaDetails(input: MangaDetailsInput): Promise<ExtensionSeriesDetails>;
  getChapterPages(input: ChapterPagesInput): Promise<ExtensionChapterPages>;
}

export interface ExtensionRepositoryEntry extends ExtensionMetadata {
  readonly iconURL: string;
  readonly downloadURL: string;
  readonly sha256: string;
  readonly sourceSize: number;
}

export interface ExtensionRepositoryIndex {
  readonly schemaVersion: number;
  readonly extensions: readonly ExtensionRepositoryEntry[];
}

export interface ExtensionManifest extends ExtensionMetadata {
  readonly iconURL: string;
  readonly downloadURL: string;
  readonly entrypoint: string;
  readonly artifactPath: string;
}

export interface YomuFetchRequest {
  readonly url: string;
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
}

export interface YomuFetchResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  text(): string;
  json(): unknown;
}

export interface YomuBridge {
  fetch(request: YomuFetchRequest): Promise<YomuFetchResponse>;
  readonly storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<boolean>;
    remove(key: string): Promise<boolean>;
  };
  readonly log: {
    debug(message: string): Promise<boolean>;
    info(message: string): Promise<boolean>;
    error(message: string): Promise<boolean>;
  };
}

declare global {
  var yomu: YomuBridge;
  var yomuExtension: YomuExtension | undefined;
}

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SEMANTIC_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export function validateMetadata(value: unknown): asserts value is ExtensionMetadata {
  const metadata = requireRecord(value, "Extension metadata");
  requireMatchingString(metadata, "identifier", IDENTIFIER_PATTERN);
  requireNonEmptyString(metadata, "name");
  requireMatchingString(metadata, "version", SEMANTIC_VERSION_PATTERN);
  requireInteger(metadata, "contractVersion", YOMU_CONTRACT_VERSION);
  requireMatchingString(metadata, "language", LANGUAGE_PATTERN);
}

export function validateExtension(extension: unknown): asserts extension is YomuExtension {
  const candidate = requireRecord(extension, "Extension");
  validateMetadata(candidate.metadata);

  for (const method of [
    "getPopular",
    "getSearch",
    "getMangaDetails",
    "getChapterPages",
  ] as const) {
    if (typeof candidate[method] !== "function") {
      throw new TypeError(`Extension method "${method}" is required.`);
    }
  }
}

export function validateManifest(value: unknown): asserts value is ExtensionManifest {
  validateMetadata(value);
  const manifest = requireRecord(value, "Extension manifest");
  requireHttpsURL(manifest, "iconURL");
  requireHttpsURL(manifest, "downloadURL");
  requireNonEmptyString(manifest, "entrypoint");
  requireNonEmptyString(manifest, "artifactPath");
}

export function validateRepositoryIndex(
  value: unknown,
): asserts value is ExtensionRepositoryIndex {
  const index = requireRecord(value, "Repository index");
  requireInteger(index, "schemaVersion", REPOSITORY_SCHEMA_VERSION);

  if (!Array.isArray(index.extensions)) {
    throw new TypeError('Repository index field "extensions" must be an array.');
  }

  const identifiers = new Set<string>();
  for (const valueEntry of index.extensions) {
    validateMetadata(valueEntry);
    const entry = requireRecord(valueEntry, "Repository entry");
    requireHttpsURL(entry, "iconURL");
    requireHttpsURL(entry, "downloadURL");
    requireMatchingString(entry, "sha256", SHA256_PATTERN);
    requirePositiveInteger(entry, "sourceSize");

    const identifier = entry.identifier as string;
    if (identifiers.has(identifier)) {
      throw new TypeError(`Duplicate extension identifier "${identifier}".`);
    }
    identifiers.add(identifier);
  }
}

function requireRecord(value: unknown, subject: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${subject} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(
  record: Record<string, unknown>,
  field: string,
): void {
  const value = record[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`Field "${field}" must be a non-empty string.`);
  }
}

function requireMatchingString(
  record: Record<string, unknown>,
  field: string,
  pattern: RegExp,
): void {
  requireNonEmptyString(record, field);
  if (!pattern.test(record[field] as string)) {
    throw new TypeError(`Field "${field}" has an invalid format.`);
  }
}

function requireInteger(
  record: Record<string, unknown>,
  field: string,
  expected: number,
): void {
  if (record[field] !== expected) {
    throw new TypeError(`Field "${field}" must equal ${String(expected)}.`);
  }
}

function requirePositiveInteger(
  record: Record<string, unknown>,
  field: string,
): void {
  const value = record[field];
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new TypeError(`Field "${field}" must be a positive integer.`);
  }
}

function requireHttpsURL(
  record: Record<string, unknown>,
  field: string,
): void {
  requireNonEmptyString(record, field);
  const url = URL.parse(record[field] as string);
  if (url?.protocol !== "https:") {
    throw new TypeError(`Field "${field}" must be an HTTPS URL.`);
  }
}

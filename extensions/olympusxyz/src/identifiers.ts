export type OlympusSeriesType = "comic" | "novel";

export interface OlympusSeriesReference {
  readonly type: OlympusSeriesType;
  readonly slug: string;
}

export interface OlympusChapterReference {
  readonly type: OlympusSeriesType;
  readonly slug: string;
  readonly chapterId: number;
}

export function isOlympusSeriesType(value: string): value is OlympusSeriesType {
  return value === "comic" || value === "novel";
}

export function encodeSeriesIdentifier(type: OlympusSeriesType, slug: string): string {
  return `${type}:${slug}`;
}

export function decodeSeriesIdentifier(identifier: string): OlympusSeriesReference {
  const separatorIndex = identifier.indexOf(":");
  if (separatorIndex <= 0) {
    throw new Error(`Series identifier "${identifier}" is not a valid Olympus Scans identifier.`);
  }

  const type = identifier.slice(0, separatorIndex);
  const slug = identifier.slice(separatorIndex + 1);
  if (!isOlympusSeriesType(type) || slug.length === 0) {
    throw new Error(`Series identifier "${identifier}" is not a valid Olympus Scans identifier.`);
  }

  return { type, slug };
}

export function encodeChapterIdentifier(
  type: OlympusSeriesType,
  slug: string,
  chapterId: number,
): string {
  return `${encodeSeriesIdentifier(type, slug)}:${String(chapterId)}`;
}

export function decodeChapterIdentifier(identifier: string): OlympusChapterReference {
  const firstSeparator = identifier.indexOf(":");
  const lastSeparator = identifier.lastIndexOf(":");
  if (firstSeparator <= 0 || lastSeparator <= firstSeparator) {
    throw new Error(`Chapter identifier "${identifier}" is not a valid Olympus Scans identifier.`);
  }

  const type = identifier.slice(0, firstSeparator);
  const slug = identifier.slice(firstSeparator + 1, lastSeparator);
  const chapterIdText = identifier.slice(lastSeparator + 1);
  if (!isOlympusSeriesType(type) || slug.length === 0 || chapterIdText.length === 0) {
    throw new Error(`Chapter identifier "${identifier}" is not a valid Olympus Scans identifier.`);
  }

  const chapterId = Number.parseInt(chapterIdText, 10);
  if (!Number.isInteger(chapterId) || chapterId <= 0) {
    throw new Error(`Chapter identifier "${identifier}" is not a valid Olympus Scans identifier.`);
  }

  return { type, slug, chapterId };
}

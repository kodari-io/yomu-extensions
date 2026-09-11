import { describe, expect, it } from "vitest";
import {
  decodeChapterIdentifier,
  decodeSeriesIdentifier,
  encodeChapterIdentifier,
  encodeSeriesIdentifier,
} from "./identifiers.ts";

describe("Olympus Scans identifiers", (): void => {
  it("round-trips a series identifier", (): void => {
    const identifier = encodeSeriesIdentifier("comic", "test-series");
    expect(decodeSeriesIdentifier(identifier)).toEqual({
      type: "comic",
      slug: "test-series",
    });
  });

  it("round-trips a chapter identifier", (): void => {
    const identifier = encodeChapterIdentifier("novel", "test-series", 501);
    expect(decodeChapterIdentifier(identifier)).toEqual({
      type: "novel",
      slug: "test-series",
      chapterId: 501,
    });
  });

  it("rejects malformed series identifiers", (): void => {
    expect(() => {
      decodeSeriesIdentifier("unknown-type:test-series");
    }).toThrow('Series identifier "unknown-type:test-series" is not a valid Olympus Scans identifier.');
    expect(() => {
      decodeSeriesIdentifier("comic:");
    }).toThrow();
    expect(() => {
      decodeSeriesIdentifier("no-separator");
    }).toThrow();
  });

  it("rejects malformed chapter identifiers", (): void => {
    expect(() => {
      decodeChapterIdentifier("comic:test-series:not-a-number");
    }).toThrow();
    expect(() => {
      decodeChapterIdentifier("comic:test-series");
    }).toThrow();
  });
});

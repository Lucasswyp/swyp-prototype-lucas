import { describe, expect, it } from "vitest";
import { muxPlaybackIdFromUrl, storagePathFromUrl } from "@/lib/muxAsset";

describe("muxPlaybackIdFromUrl", () => {
  it("haalt de id uit een Mux-adres", () => {
    expect(muxPlaybackIdFromUrl("https://stream.mux.com/abc123XYZ.m3u8")).toBe("abc123XYZ");
    expect(muxPlaybackIdFromUrl("https://stream.mux.com/abc123XYZ.m3u8?token=1")).toBe("abc123XYZ");
  });
  it("geeft niets voor andere adressen", () => {
    expect(muxPlaybackIdFromUrl("https://x.supabase.co/storage/v1/object/public/ad-videos/a/b.mp4")).toBeNull();
    expect(muxPlaybackIdFromUrl("https://evil.com/stream.mux.com/abc.m3u8")).toBeNull();
    expect(muxPlaybackIdFromUrl("")).toBeNull();
    expect(muxPlaybackIdFromUrl(null)).toBeNull();
  });
});

describe("storagePathFromUrl", () => {
  it("haalt het pad uit de opslag", () => {
    expect(storagePathFromUrl("https://x.supabase.co/storage/v1/object/public/ad-videos/bid/vid.MOV")).toBe("bid/vid.MOV");
    expect(storagePathFromUrl("https://x.supabase.co/storage/v1/object/public/ad-videos/bid/vid.mp4?x=1")).toBe("bid/vid.mp4");
  });
  it("geeft niets voor Mux of leeg", () => {
    expect(storagePathFromUrl("https://stream.mux.com/abc.m3u8")).toBeNull();
    expect(storagePathFromUrl(undefined)).toBeNull();
  });
});

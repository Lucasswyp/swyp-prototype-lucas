import { describe, it, expect } from "vitest";
import { muxPosterUrl, muxStreamUrl } from "./mux";
import { isHlsUrl } from "./useHlsSource";

describe("mux urls", () => {
  it("builds the HLS stream url", () => {
    expect(muxStreamUrl("abc123")).toBe("https://stream.mux.com/abc123.m3u8");
  });
  it("builds a thumbnail url", () => {
    expect(muxPosterUrl("abc123")).toBe("https://image.mux.com/abc123/thumbnail.jpg?time=1");
  });
});

describe("isHlsUrl", () => {
  it("recognises HLS playlists", () => {
    expect(isHlsUrl("https://stream.mux.com/abc123.m3u8")).toBe(true);
  });
  it("treats mp4 files and empty values as not HLS", () => {
    expect(isHlsUrl("https://example.com/video.mp4")).toBe(false);
    expect(isHlsUrl(undefined)).toBe(false);
  });
});

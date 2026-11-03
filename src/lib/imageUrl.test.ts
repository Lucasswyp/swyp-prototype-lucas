import { describe, expect, it } from "vitest";
import { firstUsableImage, isUsableImageUrl } from "@/lib/imageUrl";

describe("isUsableImageUrl", () => {
  it("accepteert gewone plaatjes en Mux-miniaturen", () => {
    expect(isUsableImageUrl("https://images.unsplash.com/photo-1?w=800")).toBe(true);
    expect(isUsableImageUrl("https://image.mux.com/abc/thumbnail.jpg?time=1")).toBe(true);
    expect(isUsableImageUrl("/brand/swyp-logo.png")).toBe(true);
  });
  it("weigert videobestanden, lege waarden en onzin", () => {
    expect(isUsableImageUrl("https://x.supabase.co/storage/v1/object/public/ad-videos/a/b.MOV")).toBe(false);
    expect(isUsableImageUrl("https://stream.mux.com/abc.m3u8")).toBe(false);
    expect(isUsableImageUrl("https://x.nl/film.mp4?download=1")).toBe(false);
    expect(isUsableImageUrl("")).toBe(false);
    expect(isUsableImageUrl(null)).toBe(false);
    expect(isUsableImageUrl("javascript:alert(1)")).toBe(false);
  });
  it("pakt het eerste bruikbare plaatje", () => {
    expect(firstUsableImage("a.mov", "", "https://x.nl/a.jpg", "https://x.nl/b.jpg")).toBe("https://x.nl/a.jpg");
    expect(firstUsableImage("https://x/film.mov", null)).toBe("");
  });
});

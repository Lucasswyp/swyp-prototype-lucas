import type { MetadataRoute } from "next";

const paths = ["/", "/for-business", "/get-started", "/business/signup", "/privacy", "/terms", "/support", "/test"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `https://swyp.it${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}

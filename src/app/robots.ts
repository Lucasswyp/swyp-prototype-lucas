import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/business/", "/admin/", "/api/", "/auth/"] }],
    sitemap: "https://swyp.it/sitemap.xml",
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Swyp — Swipe. Spaar. Profiteer.",
    short_name: "Swyp",
    description:
      "Swipe door advertenties die bij je passen, verdien Swyp Tokens en wissel ze in voor echte voordelen.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0A2E",
    theme_color: "#0B0A2E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

import { ImageResponse } from "next/og";
import { brandDataUrl } from "@/lib/brandAssets";

export const alt = "Swyp — Swipe. Spaar. Profiteer.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Voorbeeldplaatje voor links in WhatsApp, Instagram, iMessage en Google.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B0A2E 0%, #2A1670 55%, #7B3DFF 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandDataUrl("swyp-logo.png")} width={620} height={Math.round(620 / (992 / 364))} alt="Swyp" />
        <div style={{ fontSize: 40, marginTop: 24, opacity: 0.85 }}>Swipe. Spaar. Profiteer.</div>
      </div>
    ),
    size
  );
}

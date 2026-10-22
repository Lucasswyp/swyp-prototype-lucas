import { ImageResponse } from "next/og";

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
        <div
          style={{
            display: "flex",
            width: 150,
            height: 150,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 40,
            background: "linear-gradient(135deg, #7B3DFF, #FF3EDB)",
            fontSize: 110,
            fontWeight: 800,
            marginBottom: 40,
          }}
        >
          S
        </div>
        <div style={{ fontSize: 86, fontWeight: 800, letterSpacing: -2 }}>Swyp</div>
        <div style={{ fontSize: 40, marginTop: 16, opacity: 0.85 }}>Swipe. Spaar. Profiteer.</div>
      </div>
    ),
    size
  );
}

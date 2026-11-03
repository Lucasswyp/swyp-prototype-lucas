import { ImageResponse } from "next/og";
import { BRAND_BG, brandDataUrl } from "@/lib/brandAssets";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_BG,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandDataUrl("swyp-icon.png")} width={150} height={134} alt="" />
      </div>
    ),
    { width: 192, height: 192 }
  );
}

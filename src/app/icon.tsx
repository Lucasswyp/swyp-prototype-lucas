import { ImageResponse } from "next/og";
import { BRAND_BG, brandDataUrl } from "@/lib/brandAssets";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
        <img src={brandDataUrl("swyp-icon.png")} width={56} height={50} alt="" />
      </div>
    ),
    { ...size }
  );
}

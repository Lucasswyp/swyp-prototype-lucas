import { ImageResponse } from "next/og";
import { BRAND_BG, brandDataUrl } from "@/lib/brandAssets";
import { STARTUP_SIZES, parseStartupFile, startupFile } from "@/lib/startupImages";

export const dynamic = "force-static";

export function generateStaticParams() {
  return STARTUP_SIZES.map((s) => ({ file: startupFile(s) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const size = parseStartupFile(file);
  if (!size) return new Response("Niet gevonden", { status: 404 });

  const logoWidth = Math.round(size.width * 0.5);
  const logoHeight = Math.round(logoWidth * (364 / 992));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_BG }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandDataUrl("swyp-logo.png")} width={logoWidth} height={logoHeight} alt="" />
      </div>
    ),
    { width: size.width, height: size.height, headers: { "Cache-Control": "public, max-age=31536000, immutable" } }
  );
}

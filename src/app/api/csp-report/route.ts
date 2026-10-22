import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Ontvangt CSP-overtredingen van de browser (nu nog in Report-Only). Ze komen
// in de Vercel-logs terecht, zodat we kunnen zien wat er geblokkeerd zou
// worden voordat de policy echt afgedwongen wordt.
export async function POST(request: Request) {
  try {
    const text = (await request.text()).slice(0, 4000);
    const body = JSON.parse(text);
    const report = body["csp-report"] ?? body;
    console.warn("[csp-report]", {
      directive: report["effective-directive"] ?? report["violated-directive"],
      blocked: report["blocked-uri"],
      document: report["document-uri"],
      source: report["source-file"],
    });
  } catch {
    // Een kapotte melding negeren we.
  }
  return new NextResponse(null, { status: 204 });
}

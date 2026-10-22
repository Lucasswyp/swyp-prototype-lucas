// Universele links: vertelt iOS dat swyp.it/app/... in de Swyp-app geopend mag
// worden. Het app-id is team-id + bundle-id (it.swyp.app). Moet als JSON zonder
// extensie en zonder redirect worden geserveerd.
export const dynamic = "force-static";

const body = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "5YNP5PZ27W.it.swyp.app",
        paths: ["/app", "/app/product/*", "/app/company/*", "/app/messages/*"],
      },
    ],
  },
};

export function GET() {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });
}

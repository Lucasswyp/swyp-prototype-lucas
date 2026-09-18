import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "it.swyp.app",
  appName: "Swyp",
  webDir: "public",
  // The app is a thin native shell around the live Vercel deployment, so
  // every push to production updates the app instantly with no App Store
  // review needed for content changes — only for native shell changes.
  // Opens straight into the swipeable feed, not the marketing landing page —
  // the native app should feel like TikTok, not a website with a homepage.
  server: {
    url: "https://swyp-prototype-lucas.vercel.app/app",
    cleartext: false,
  },
  // Without an explicit backgroundColor, the native root view behind the
  // WebView defaults to white. Combined with contentInset reserving safe
  // area space it doesn't paint, that showed up as a white sliver at the
  // bottom of the screen (behind the home indicator). Setting the brand
  // color here and letting the WebView draw fully edge-to-edge (our own CSS
  // already handles safe-area padding) removes the gap entirely.
  backgroundColor: "#0B0A2E",
  ios: {
    backgroundColor: "#0B0A2E",
    contentInset: "never",
  },
};

export default config;

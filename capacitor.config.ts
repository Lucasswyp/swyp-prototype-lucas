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
  ios: {
    contentInset: "always",
  },
};

export default config;

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.swyp.app",
  appName: "Swyp",
  webDir: "public",
  // The app is a thin native shell around the live Vercel deployment, so
  // every push to production updates the app instantly with no App Store
  // review needed for content changes — only for native shell changes.
  server: {
    url: "https://swyp-prototype-lucas.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;

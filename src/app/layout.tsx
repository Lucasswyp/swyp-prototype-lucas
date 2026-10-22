import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { StoreHydrator } from "@/components/StoreHydrator";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { NativeAppRefresh } from "@/components/NativeAppRefresh";
import { NativeOAuthListener } from "@/components/NativeOAuthListener";
import { ReferralCapture } from "@/components/ReferralCapture";
import { NativePushRegistration } from "@/components/NativePushRegistration";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const description =
  "Swyp brengt consumenten en bedrijven samen: swipe door advertenties die bij je passen, verdien Swyp Tokens en wissel ze in voor echte voordelen.";

export const metadata: Metadata = {
  metadataBase: new URL("https://swyp.it"),
  title: "Swyp — Swipe. Spaar. Profiteer.",
  description,
  openGraph: {
    type: "website",
    siteName: "Swyp",
    locale: "nl_NL",
    url: "https://swyp.it",
    title: "Swyp — Swipe. Spaar. Profiteer.",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Swyp — Swipe. Spaar. Profiteer.",
    description,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Swyp",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0A2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-indigo text-white">
        <PostHogProvider>
          <StoreHydrator />
          <ServiceWorkerRegister />
          <NativeAppRefresh />
          <NativeOAuthListener />
          <ReferralCapture />
          <NativePushRegistration />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}

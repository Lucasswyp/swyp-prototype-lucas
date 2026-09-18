import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { StoreHydrator } from "@/components/StoreHydrator";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
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

export const metadata: Metadata = {
  title: "Swyp — Swipe. Spaar. Profiteer.",
  description:
    "Swyp brengt consumenten en bedrijven samen: swipe door advertenties die bij je passen, verdien Swyp Tokens en wissel ze in voor echte voordelen.",
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
        <StoreHydrator />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import LayoutClient from "@/components/layout-client";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "GTA Hub Store - Premium GTA Mods & Marketplace",
  description: "High-quality GTA Peds, Props, MLOs, Buildings, Vehicles, Scripts, and Custom Game Assets.",
  openGraph: {
    title: "GTA Hub Store - Premium GTA Mods",
    description: "Premium GTA digital marketplace with stunning visuals, optimized FiveM scripts, peds, maps, and buildings.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <LayoutClient>
          {children}
        </LayoutClient>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

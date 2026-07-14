import type { Metadata } from "next";
import "./globals.css";
import LayoutClient from "@/components/layout-client";

export const metadata: Metadata = {
  title: "GTA Hub Store - Premium GTA V Mods & Marketplace",
  description: "High-quality GTA V Peds, Props, MLOs, Buildings, Vehicles, Scripts, and Custom Game Assets.",
  openGraph: {
    title: "GTA Hub Store - Premium GTA V Mods",
    description: "Premium GTA V digital marketplace with stunning visuals, optimized FiveM scripts, peds, maps, and buildings.",
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
      </body>
    </html>
  );
}

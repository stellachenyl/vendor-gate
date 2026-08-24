import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RoleProvider } from "@/lib/role-context";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quality.totalonics.com"),
  title: {
    default: "Totalonics Quality — Supplier Quality Portal",
    template: "%s · Totalonics Quality",
  },
  description:
    "Manage vendor performance scorecards, incoming inspections, and 8D corrective actions. ISO 9001:2015 and IATF 16949:2016 compliant supplier quality management.",
  keywords: [
    "supplier quality",
    "incoming inspection",
    "NCR",
    "8D corrective action",
    "IATF 16949",
    "ISO 9001",
  ],
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <ToastProvider>
          <RoleProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
            >
              Skip to main content
            </a>
            <Navbar />
            <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
              {children}
            </main>
            <Footer />
          </RoleProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

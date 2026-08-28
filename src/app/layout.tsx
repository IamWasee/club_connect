import type { Metadata, Viewport } from "next";

import { BottomNav } from "@/components/BottomNav";
import { Grain } from "@/components/Poster";
import { Header } from "@/components/Header";
import { DemoProvider } from "@/demo/store";

import "./globals.css";
import { Archivo, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

// Exposed as `--font-geist`, which `--font-sans` in globals.css lists first
// with a system stack behind it. Naming it `--font-sans` directly would make
// that token refer to itself.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// Archivo carries the poster's headline setting: wide, near-black, tight.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ClubConnect",
  description: "School announcements, clubs, and events - one feed.",
};

export const viewport: Viewport = {
  // Lets the bottom bar paint under the home indicator and read
  // env(safe-area-inset-*) on notched iPhones.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e4ece5" },
    { media: "(prefers-color-scheme: dark)", color: "#1b241e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, archivo.variable)}>
      <body className="font-sans antialiased">
        <Grain />
        <DemoProvider>
          <Header />
          {/* pb-24 on phones clears the fixed bottom bar. */}
          <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pb-14 sm:pt-14">
            {children}
          </main>
          <BottomNav />
        </DemoProvider>
      </body>
    </html>
  );
}

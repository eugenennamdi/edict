import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

import { Geist_Mono, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistHeading = Geist({
  subsets: ["latin"],
  variable: "--font-heading",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://edict.finance"),
  title: "Edict: Autonomous Compliance OS for Onchain Finance",
  description: "The autonomous compliance operating system for onchain finance.",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/logo-final.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Edict: Autonomous Compliance OS for Onchain Finance",
    description: "The autonomous compliance operating system for onchain finance.",
    url: "https://edict.finance",
    siteName: "Edict",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Edict - Autonomous Compliance OS for Onchain Finance",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Edict: Autonomous Compliance OS for Onchain Finance",
    description: "The autonomous compliance operating system for onchain finance.",
    images: ["/logo.png"],
  },
};

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { Monitor } from "lucide-react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(geist.variable, geistHeading.variable, geistMono.variable)}>
      <body className="font-sans antialiased min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors duration-300">
        <Providers>
          {/* Mobile Blocker Screen */}
          <div className="block md:hidden fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-sm mx-auto flex flex-col items-center gap-5 p-8 rounded-[2rem] border border-black/10 dark:border-white/10 bg-card shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-foreground">
                <Monitor className="w-7 h-7 opacity-80" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Desktop Environment Required
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Please access this application on a desktop browser to continue.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Application View */}
          <div className="hidden md:flex md:flex-col md:min-h-[100dvh] w-full">
            <Header />
            <main className="flex-grow w-full">
              {children}
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

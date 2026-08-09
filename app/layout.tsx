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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(geist.variable, geistHeading.variable, geistMono.variable)}>
      <body className="font-sans antialiased min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors duration-300">
        <Providers>
          <Header />
          <main className="flex-grow w-full">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

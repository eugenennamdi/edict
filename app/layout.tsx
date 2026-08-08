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
  title: "Edict | Elite Compliance OS",
  description: "Autonomous Compliance Operating System for Onchain Finance",
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

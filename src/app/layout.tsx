import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#00897B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://groway.co.za"),
  title: "Groway - Africa's Integrated Financial Operating System",
  description: "One platform. Six powerful applications. Everything you need to pay, sell, source, and scale your business across South Africa and beyond. Consumer Wallet, Merchant OS, GroSupply, GoPay, Admin Console, Enterprise Management.",
  keywords: ["Groway", "Africa", "Fintech", "Payments", "POS", "Wallet", "B2B", "South Africa", "Mobile Money", "Digital Payments"],
  authors: [{ name: "Groway Team" }],
  icons: {
    icon: "/groway-logo.png",
    apple: "/groway-logo.png",
  },
  openGraph: {
    title: "Groway - Africa's Integrated Financial Operating System",
    description: "Pay, sell, source, and scale with Africa's most comprehensive financial platform.",
    url: "https://groway.co.za",
    siteName: "Groway",
    type: "website",
    images: [
      {
        url: "/groway-logo.png",
        width: 1200,
        height: 630,
        alt: "Groway Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Groway - Africa's Integrated Financial Operating System",
    description: "Pay, sell, source, and scale with Africa's most comprehensive financial platform.",
    images: ["/groway-logo.png"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

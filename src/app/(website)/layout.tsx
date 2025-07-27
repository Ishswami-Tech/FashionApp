import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/app/providers/QueryProvider";
import React from "react";
import Header from '@/components/ui/Header';

export const metadata: Metadata = {
  title: {
    default: "Sony Fashion - Custom Tailoring & Designer Wear",
    template: "%s | Sony Fashion",
  },
  description:
    "Custom tailoring, designer kurtis, saree blouses, and party dresses in Pune. Perfect fit, premium fabrics, expert craftsmanship.",
  keywords:
    "custom tailoring, designer kurtis, saree blouses, party dresses, fashion studio, Pune, Sony Fashion",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Sony Fashion - Custom Tailoring & Designer Wear",
    description:
      "Custom tailoring, designer kurtis, saree blouses, and party dresses in Pune. Perfect fit, premium fabrics, expert craftsmanship.",
    url: "/",
    siteName: "Sony Fashion",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Sony Fashion - Custom Tailoring",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sony Fashion - Custom Tailoring & Designer Wear",
    description:
      "Custom tailoring, designer kurtis, saree blouses, and party dresses in Pune. Perfect fit, premium fabrics, expert craftsmanship.",
    images: ["/og-image.webp"],
  },
  authors: [{ name: "Sony Fashion" }],
  creator: "Sony Fashion",
  publisher: "Sony Fashion",
  metadataBase: new URL("https://sonyfashion.in"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ec4899" />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="robots" href="/robots.txt" />
        <meta name="robots" content="index, follow" />
        
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/gallery/design1.webp" as="image" />
        <link rel="preload" href="/gallery/design2.webp" as="image" />
      </head>
      <body className="antialiased" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <Toaster richColors />
        <Header />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
} 
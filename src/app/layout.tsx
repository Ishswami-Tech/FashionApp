import type { Metadata } from "next";
import "./globals.css";
import { connectToDatabase } from "@/lib/mongodb";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/app/providers/QueryProvider";

// Add these imports at the top

export const metadata: Metadata = {
  title: {
    default: "Sony Fashion - Tailoring & Orders",
    template: "%s | Sony Fashion",
  },
  description:
    "Sony Fashion: Custom tailoring, order management, and unique design solutions in Pune. Modern, responsive, and accessible.",
  keywords:
    "sony fashion, tailoring, custom design, order, clothing, boutique, dressmaking, online fashion, style, designer, measurements, delivery, payment, Pune",
  authors: [{ name: "Sony Fashion" }],
  creator: "Sony Fashion",
  publisher: "Sony Fashion",
  metadataBase: new URL("https://sonyfashion.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sony Fashion - Tailoring & Orders",
    description:
      "Sony Fashion: Custom tailoring, order management, and unique design solutions in Pune. Modern, responsive, and accessible.",
    url: "/",
    siteName: "Sony Fashion",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sony Fashion",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sony Fashion - Tailoring & Orders",
    description:
      "Sony Fashion: Custom tailoring, order management, and unique design solutions in Pune. Modern, responsive, and accessible.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

// Attempt to connect to MongoDB when the layout is loaded
(async () => {
  try {
    await connectToDatabase();
    console.log("[Layout] MongoDB connection established");
  } catch (err) {
    console.error("[Layout] MongoDB connection failed:", err);
  }
})();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="robots" href="/robots.txt" />
        <meta name="robots" content="index, follow" />
      </head>
      <body className="antialiased" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <Toaster richColors />
        <QueryProvider>
        {children}
        </QueryProvider>
      </body>
    </html>
  );
}

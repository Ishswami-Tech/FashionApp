import type { Metadata } from "next";
import "./globals.css";
import { connectToDatabase } from "@/lib/mongodb";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/app/providers/QueryProvider";

// Add these imports at the top

export const metadata: Metadata = {
  title: {
    default: "Sony Fashion - Custom Tailoring, Orders & Designs",
    template: "%s | Sony Fashion",
  },
  description:
    "Sony Fashion: Premium custom tailoring, order management, and unique design solutions. Modern, responsive, and accessible for all your fashion needs.",
  keywords:
    "sony fashion, tailoring, custom design, order, clothing, boutique, dressmaking, online fashion, style, designer, measurements, delivery, payment",
  authors: [{ name: "Sony Fashion" }],
  creator: "Sony Fashion",
  publisher: "Sony Fashion",
  metadataBase: new URL("https://sonyfashion.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sony Fashion - Custom Tailoring, Orders & Designs",
    description:
      "Sony Fashion: Premium custom tailoring, order management, and unique design solutions. Modern, responsive, and accessible for all your fashion needs.",
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
    title: "Sony Fashion - Custom Tailoring, Orders & Designs",
    description:
      "Sony Fashion: Premium custom tailoring, order management, and unique design solutions. Modern, responsive, and accessible for all your fashion needs.",
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

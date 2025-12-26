import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Strip quotes if present (Docker may pass them as part of the value)
const rawUrl = process.env.NEXTAUTH_URL || "https://link.hcmute.edu.vn";
const siteUrl = rawUrl.replace(/^["']|["']$/g, "");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  // Basic SEO
  title: {
    default: "HCMUTE S-Link & QR Code - Rút gọn liên kết miễn phí",
    template: "%s | HCMUTE S-Link",
  },
  description:
    "Công cụ rút gọn liên kết và tạo mã QR miễn phí của Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE). Tạo link ngắn, theo dõi thống kê, và chia sẻ dễ dàng.",
  keywords: [
    "rút gọn link",
    "url shortener",
    "HCMUTE",
    "qr code",
    "short link",
    "tạo mã QR",
    "link ngắn",
    "Đại học Sư phạm Kỹ thuật",
    "SPKT",
    "short url",
    "link rút gọn miễn phí",
  ],
  authors: [{ name: "HCMUTE - Trường Đại học Sư phạm Kỹ thuật TP.HCM", url: "https://hcmute.edu.vn" }],
  creator: "HCMUTE",
  publisher: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",

  // Canonical & Base URL
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "vi-VN": "/",
    },
  },

  // Robots
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

  // Open Graph
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "HCMUTE S-Link",
    title: "HCMUTE S-Link & QR Code - Rút gọn liên kết miễn phí",
    description:
      "Công cụ rút gọn liên kết và tạo mã QR miễn phí của Trường Đại học Sư phạm Kỹ thuật TP.HCM. Tạo link ngắn, theo dõi thống kê, và chia sẻ dễ dàng.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HCMUTE S-Link & QR Code",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "HCMUTE S-Link & QR Code - Rút gọn liên kết miễn phí",
    description:
      "Công cụ rút gọn liên kết và tạo mã QR miễn phí của HCMUTE. Tạo link ngắn, theo dõi thống kê, và chia sẻ dễ dàng.",
    images: ["/og-image.png"],
    creator: "@hcmute",
  },

  // App-specific
  applicationName: "HCMUTE S-Link",
  category: "technology",
  classification: "URL Shortener",

  // Verification (add your verification codes)
  // verification: {
  //   google: "your-google-verification-code",
  // },

  // Icons
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },

  // Manifest
  manifest: "/site.webmanifest",

  // Other
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "HCMUTE S-Link",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HCMUTE S-Link & QR Code",
  description:
    "Công cụ rút gọn liên kết và tạo mã QR miễn phí của Trường Đại học Sư phạm Kỹ thuật TP.HCM",
  url: siteUrl,
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "VND",
  },
  author: {
    "@type": "EducationalOrganization",
    name: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    alternateName: "HCMUTE",
    url: "https://hcmute.edu.vn",
  },
  provider: {
    "@type": "EducationalOrganization",
    name: "HCMUTE",
    url: "https://hcmute.edu.vn",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HCMUTE S-Link & QR Code",
  description: "Rút gọn liên kết và tạo mã QR dễ dàng với công cụ miễn phí của HCMUTE",
  keywords: ["url shortener", "rút gọn link", "HCMUTE", "qr code", "short link"],
  authors: [{ name: "HCMUTE" }],
  openGraph: {
    title: "HCMUTE S-Link & QR Code",
    description: "Rút gọn liên kết và tạo mã QR dễ dàng với công cụ miễn phí của HCMUTE",
    type: "website",
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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
 
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

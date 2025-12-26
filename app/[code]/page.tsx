import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import crypto from "crypto";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ code: string }>;
}

// Fetch OG metadata from original URL
async function fetchOGMetadata(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HCMUTEBot/1.0)",
      },
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Parse OG tags
    const getMetaContent = (property: string) => {
      const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
      const altRegex = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, "i");
      const match = html.match(regex) || html.match(altRegex);
      return match ? match[1] : null;
    };
    
    const getMetaName = (name: string) => {
      const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, "i");
      const altRegex = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, "i");
      const match = html.match(regex) || html.match(altRegex);
      return match ? match[1] : null;
    };
    
    // Get title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMetaContent("og:title") || titleMatch?.[1] || null;
    
    return {
      title: title?.substring(0, 200),
      description: (getMetaContent("og:description") || getMetaName("description"))?.substring(0, 500),
      image: getMetaContent("og:image"),
      siteName: getMetaContent("og:site_name"),
    };
  } catch {
    return null;
  }
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  
  const url = await prisma.url.findUnique({
    where: { shortCode: code },
  });

  if (!url) {
    return { title: "Không tìm thấy" };
  }

  // Try to fetch OG data from original URL
  const ogData = await fetchOGMetadata(url.originalUrl);
  
  const baseUrl = process.env.NEXTAUTH_URL || "https://link.hcmute.edu.vn";
  
  return {
    title: ogData?.title || `Chuyển hướng đến ${new URL(url.originalUrl).hostname}`,
    description: ogData?.description || `Liên kết rút gọn HCMUTE - Nhấp để truy cập ${url.originalUrl}`,
    openGraph: {
      title: ogData?.title || `HCMUTE S-Link`,
      description: ogData?.description || `Nhấp để truy cập liên kết`,
      images: ogData?.image ? [ogData.image] : [`${baseUrl}/og-image.png`],
      siteName: ogData?.siteName || "HCMUTE S-Link",
      type: "website",
      url: `${baseUrl}/${code}`,
    },
    twitter: {
      card: "summary_large_image",
      title: ogData?.title || `HCMUTE S-Link`,
      description: ogData?.description || `Nhấp để truy cập liên kết`,
      images: ogData?.image ? [ogData.image] : [`${baseUrl}/og-image.png`],
    },
  };
}

export default async function RedirectPage({ params }: PageProps) {
  const { code } = await params;
  
  // Find the URL by short code
  const url = await prisma.url.findUnique({
    where: { shortCode: code },
  });

  if (!url) {
    notFound();
  }

  // Record the visit asynchronously (don't block redirect)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || undefined;
  const referer = headersList.get("referer") || undefined;

  // Hash the IP for privacy
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);

  // Record visit and increment count (fire and forget)
  prisma.$transaction([
    prisma.visit.create({
      data: {
        urlId: url.id,
        ipHash,
        userAgent: userAgent?.substring(0, 255),
        referer: referer?.substring(0, 500),
      },
    }),
    prisma.url.update({
      where: { id: url.id },
      data: { visitCount: { increment: 1 } },
    }),
  ]).catch((err) => console.error("Error recording visit:", err));

  redirect(url.originalUrl);
}

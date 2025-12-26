import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import crypto from "crypto";

// Use Edge Runtime for faster cold starts
export const runtime = "nodejs"; // Keep nodejs for Prisma compatibility
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function RedirectPage({ params }: PageProps) {
  const { code } = await params;
  
  // Find the URL by short code
  const url = await prisma.url.findUnique({
    where: { shortCode: code },
    select: { id: true, originalUrl: true }, // Only select needed fields for speed
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

  // Record visit and increment count (fire and forget - no await)
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


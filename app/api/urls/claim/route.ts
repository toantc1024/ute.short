import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

interface ClaimRequest {
  links: Array<{
    shortCode: string;
    originalUrl: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_STORAGE_MIGRATION !== "true") {
      return NextResponse.json(
        { error: "Tính năng này đã bị tắt" },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const body: ClaimRequest = await request.json();
    const { links } = body;

    if (!links || !Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: "Không có links để claim" },
        { status: 400 }
      );
    }

    const claimedLinks: string[] = [];
    const failedLinks: string[] = [];

    for (const link of links) {
      try {
        // Find the link by shortCode
        const existingUrl = await prisma.url.findUnique({
          where: { shortCode: link.shortCode },
        });

        if (!existingUrl) {
          failedLinks.push(link.shortCode);
          continue;
        }

        // Only claim if:
        // 1. The link has no owner (userId is null)
        // 2. The originalUrl matches (to verify ownership)
        if (existingUrl.userId !== null) {
          failedLinks.push(link.shortCode);
          continue;
        }

        // Check if originalUrl matches (basic verification)
        if (existingUrl.originalUrl !== link.originalUrl) {
          failedLinks.push(link.shortCode);
          continue;
        }

        // Claim the link by updating userId
        await prisma.url.update({
          where: { shortCode: link.shortCode },
          data: { userId: session.user.id },
        });

        claimedLinks.push(link.shortCode);
      } catch {
        failedLinks.push(link.shortCode);
      }
    }

    return NextResponse.json({
      success: true,
      claimed: claimedLinks,
      failed: failedLinks,
      message: claimedLinks.length > 0 
        ? `Đã nhận ${claimedLinks.length} liên kết` 
        : "Không có liên kết nào được nhận",
    });
  } catch (error) {
    console.error("Error claiming links:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi nhận liên kết" },
      { status: 500 }
    );
  }
}

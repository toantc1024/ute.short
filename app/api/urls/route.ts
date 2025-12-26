import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createUrl, getUrlsByUserId, validateShortCode as checkShortCodeDB } from "@/lib/services/url.service";
import { validateUrl, validateShortCode } from "@/lib/validations/url";

export async function GET() {
  try {
    const user = await requireAuth();
    const urls = await getUrlsByUserId(user.id);
    
    return NextResponse.json({ urls });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }
    console.error("Error fetching URLs:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { originalUrl, customCode } = body;

    // Validate URL
    const urlValidation = validateUrl(originalUrl);
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    // Validate custom short code if provided
    if (customCode) {
      const codeValidation = validateShortCode(customCode);
      if (!codeValidation.valid) {
        return NextResponse.json({ error: codeValidation.error }, { status: 400 });
      }

      // Check if code is available
      const dbValidation = await checkShortCodeDB(customCode.trim());
      if (!dbValidation.valid) {
        return NextResponse.json({ error: dbValidation.error }, { status: 400 });
      }
    }

    const url = await createUrl({
      originalUrl: urlValidation.normalizedUrl!,
      customCode: customCode?.trim(),
      userId: user.id,
    });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }
    console.error("Error creating URL:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500 });
  }
}

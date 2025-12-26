import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth";
import { 
  getUrlById, 
  getUrlByIdAdmin, 
  updateUrl, 
  updateUrlAdmin, 
  deleteUrl, 
  deleteUrlAdmin, 
  validateShortCode as checkShortCodeDB 
} from "@/lib/services/url.service";
import { validateUrl, validateShortCode } from "@/lib/validations/url";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    
    // Admin can view any URL, regular users can only view their own
    const url = isAdmin(user) 
      ? await getUrlByIdAdmin(id)
      : await getUrlById(id, user.id);
    
    if (!url) {
      return NextResponse.json({ error: "Không tìm thấy URL" }, { status: 404 });
    }
    
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }
    console.error("Error fetching URL:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const body = await req.json();
    const { originalUrl, shortCode } = body;

    const updateData: { originalUrl?: string; shortCode?: string } = {};

    // Validate and update originalUrl if provided
    if (originalUrl !== undefined) {
      const urlValidation = validateUrl(originalUrl);
      if (!urlValidation.valid) {
        return NextResponse.json({ error: urlValidation.error }, { status: 400 });
      }
      updateData.originalUrl = urlValidation.normalizedUrl;
    }

    // Validate and update shortCode if provided
    if (shortCode !== undefined) {
      const codeValidation = validateShortCode(shortCode);
      if (!codeValidation.valid) {
        return NextResponse.json({ error: codeValidation.error }, { status: 400 });
      }

      const dbValidation = await checkShortCodeDB(shortCode.trim().toLowerCase());
      if (!dbValidation.valid) {
        return NextResponse.json({ error: dbValidation.error }, { status: 400 });
      }

      updateData.shortCode = shortCode.trim().toLowerCase();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu để cập nhật" }, { status: 400 });
    }

    // Admin can update any URL, regular users can only update their own
    if (isAdmin(user)) {
      await updateUrlAdmin(id, updateData);
    } else {
      const result = await updateUrl(id, user.id, updateData);
      if (result.count === 0) {
        return NextResponse.json({ error: "Không tìm thấy URL hoặc không có quyền" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }
    console.error("Error updating URL:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;

    // Admin can delete any URL, regular users can only delete their own
    if (isAdmin(user)) {
      await deleteUrlAdmin(id);
    } else {
      const result = await deleteUrl(id, user.id);
      if (result.count === 0) {
        return NextResponse.json({ error: "Không tìm thấy URL hoặc không có quyền" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }
    console.error("Error deleting URL:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500 });
  }
}


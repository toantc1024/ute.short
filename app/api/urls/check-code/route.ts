import { NextRequest, NextResponse } from "next/server";
import { isShortCodeAvailable } from "@/lib/services/url.service";
import { validateShortCode } from "@/lib/validations/url";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    
    if (!code) {
      return NextResponse.json({ error: "Thiếu mã rút gọn" }, { status: 400 });
    }

    // Validate format first
    const validation = validateShortCode(code);
    if (!validation.valid) {
      return NextResponse.json({ available: false, error: validation.error });
    }

    // Check database
    const available = await isShortCodeAvailable(code.trim());
    
    return NextResponse.json({ 
      available,
      error: available ? undefined : "Mã rút gọn này đã được sử dụng"
    });
  } catch (error) {
    console.error("Error checking code:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500 });
  }
}

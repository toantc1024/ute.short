import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;

    // Admin can view any URL's analytics, regular users can only view their own
    const url = isAdmin(user)
      ? await prisma.url.findUnique({ where: { id } })
      : await prisma.url.findFirst({ where: { id, userId: user.id } });

    if (!url) {
      return NextResponse.json({ error: "Không tìm thấy URL" }, { status: 404 });
    }

    // Get all visits for this URL
    const visits = await prisma.visit.findMany({
      where: { urlId: id },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Calculate stats
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: visits.length,
      last24h: visits.filter(v => new Date(v.createdAt) >= last24h).length,
      last7d: visits.filter(v => new Date(v.createdAt) >= last7d).length,
      last30d: visits.filter(v => new Date(v.createdAt) >= last30d).length,
    };

    // Group by country
    const countryMap = new Map<string, number>();
    visits.forEach(v => {
      const country = v.country || "Không xác định";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const byCountry = Array.from(countryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Group by browser (from userAgent)
    const browserMap = new Map<string, number>();
    visits.forEach(v => {
      let browser = "Không xác định";
      const ua = v.userAgent?.toLowerCase() || "";
      if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
      else if (ua.includes("firefox")) browser = "Firefox";
      else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
      else if (ua.includes("edg")) browser = "Edge";
      else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });
    const byBrowser = Array.from(browserMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Group by device (from userAgent)
    const deviceMap = new Map<string, number>();
    visits.forEach(v => {
      let device = "Desktop";
      const ua = v.userAgent?.toLowerCase() || "";
      if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) device = "Mobile";
      else if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablet";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const byDevice = Array.from(deviceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Group by date (use from/to params or default 30 days)
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    
    const toDate = toParam ? new Date(toParam) : new Date();
    const fromDate = fromParam ? new Date(fromParam) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Calculate days between from and to
    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    const dateMap = new Map<string, number>();
    visits
      .filter(v => {
        const visitDate = new Date(v.createdAt);
        return visitDate >= fromDate && visitDate <= toDate;
      })
      .forEach(v => {
        const date = new Date(v.createdAt).toISOString().split("T")[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      });
    
    // Fill in missing dates
    const byDate: { date: string; visits: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      byDate.push({
        date: dateStr,
        visits: dateMap.get(dateStr) || 0,
      });
    }

    // Recent visits
    const recentVisits = visits.slice(0, 20).map(v => ({
      id: v.id,
      createdAt: v.createdAt,
      country: v.country || "Không xác định",
      referer: v.referer || "Trực tiếp",
      userAgent: v.userAgent?.substring(0, 100) || "Không xác định",
    }));

    return NextResponse.json({
      stats,
      byCountry,
      byBrowser,
      byDevice,
      byDate,
      recentVisits,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500 });
  }
}

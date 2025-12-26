import prisma from "@/lib/prisma";
import { nanoid, customAlphabet } from "nanoid";

// Alphabet for short codes - lowercase letters and numbers, excluding confusing chars
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const generateShortCode = customAlphabet(ALPHABET);

// Calculate optimal length based on usage (starts small, grows as needed)
async function getOptimalLength(): Promise<number> {
  const count = await prisma.url.count();
  // Start with 4 chars (~600k combinations), grow as needed
  if (count < 50000) return 4;
  if (count < 500000) return 5;
  if (count < 5000000) return 6;
  return 7;
}

export async function generateUniqueShortCode(): Promise<string> {
  const length = await getOptimalLength();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateShortCode(length);
    const existing = await prisma.url.findUnique({
      where: { shortCode: code },
    });
    
    if (!existing) {
      return code;
    }
    attempts++;
  }
  
  // Fallback to longer code if we hit collision issues
  return generateShortCode(length + 2);
}

export async function isShortCodeAvailable(shortCode: string): Promise<boolean> {
  const existing = await prisma.url.findUnique({
    where: { shortCode },
  });
  return !existing;
}

export async function validateShortCode(shortCode: string): Promise<{ valid: boolean; error?: string }> {
  // Check format: only alphanumeric, 3-20 chars
  if (!/^[a-zA-Z0-9-_]{3,20}$/.test(shortCode)) {
    return {
      valid: false,
      error: "Mã rút gọn chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới (3-20 ký tự)",
    };
  }

  // Check availability
  const available = await isShortCodeAvailable(shortCode);
  if (!available) {
    return {
      valid: false,
      error: "Mã rút gọn này đã được sử dụng",
    };
  }

  return { valid: true };
}

export interface CreateUrlInput {
  originalUrl: string;
  customCode?: string;
  userId: string;
}

export async function createUrl({ originalUrl, customCode, userId }: CreateUrlInput) {
  const shortCode = customCode || (await generateUniqueShortCode());

  return prisma.url.create({
    data: {
      shortCode,
      originalUrl,
      userId,
    },
  });
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getUrlsByUserId(
  userId: string, 
  { page = 1, limit = 10 }: PaginationParams = {}
): Promise<PaginatedResult<any>> {
  const skip = (page - 1) * limit;
  
  const [urls, total] = await Promise.all([
    prisma.url.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { visits: true },
        },
      },
      skip,
      take: limit,
    }),
    prisma.url.count({ where: { userId } }),
  ]);

  return {
    data: urls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Admin: Get all URLs with pagination
export async function getAllUrls(
  { page = 1, limit = 10 }: PaginationParams = {}
): Promise<PaginatedResult<any>> {
  const skip = (page - 1) * limit;
  
  const [urls, total] = await Promise.all([
    prisma.url.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { visits: true },
        },
      },
      skip,
      take: limit,
    }),
    prisma.url.count(),
  ]);

  return {
    data: urls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUrlById(id: string, userId: string) {
  return prisma.url.findFirst({
    where: { id, userId },
    include: {
      visits: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      _count: {
        select: { visits: true },
      },
    },
  });
}

// Admin: Get URL by ID without user restriction
export async function getUrlByIdAdmin(id: string) {
  return prisma.url.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      visits: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      _count: {
        select: { visits: true },
      },
    },
  });
}

export async function getUrlByShortCode(shortCode: string) {
  return prisma.url.findUnique({
    where: { shortCode },
  });
}

export async function updateUrl(id: string, userId: string, data: { originalUrl?: string; shortCode?: string }) {
  return prisma.url.updateMany({
    where: { id, userId },
    data,
  });
}

export async function deleteUrl(id: string, userId: string) {
  return prisma.url.deleteMany({
    where: { id, userId },
  });
}

// Admin: Update any URL
export async function updateUrlAdmin(id: string, data: { originalUrl?: string; shortCode?: string }) {
  return prisma.url.update({
    where: { id },
    data,
  });
}

// Admin: Delete any URL
export async function deleteUrlAdmin(id: string) {
  return prisma.url.delete({
    where: { id },
  });
}

export interface RecordVisitInput {
  urlId: string;
  ipHash?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
}

export async function recordVisit({ urlId, ipHash, userAgent, referer, country }: RecordVisitInput) {
  // Record visit and increment count in a transaction
  return prisma.$transaction([
    prisma.visit.create({
      data: {
        urlId,
        ipHash,
        userAgent,
        referer,
        country,
      },
    }),
    prisma.url.update({
      where: { id: urlId },
      data: { visitCount: { increment: 1 } },
    }),
  ]);
}

export async function getVisitStats(urlId: string) {
  const [total, last24h, last7d, last30d] = await Promise.all([
    prisma.visit.count({ where: { urlId } }),
    prisma.visit.count({
      where: {
        urlId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.visit.count({
      where: {
        urlId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.visit.count({
      where: {
        urlId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return { total, last24h, last7d, last30d };
}

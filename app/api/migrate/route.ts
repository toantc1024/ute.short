import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This is a one-time migration endpoint
// Delete this file after migration is complete
export async function POST(request: NextRequest) {
  // Simple security check - require a secret key
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  
  if (key !== "migrate-hcmute-2025") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Sample migration data - add your links here
    const linksToMigrate = [
      { id: '00068251-37f3-4cd2-9fed-08c7e9a22f44', shortCode: 'c519edbf', originalUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdaWzOIhJZN3sltUn1RaqTyjItfkMBMqz2Lg6997OpnTARN1g/viewform?usp=header', visitCount: 542 },
      { id: '00844d24-a7a6-4261-a827-d671da160a00', shortCode: 'e5a49807', originalUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSedRZMFo7DsxewUAjIQFt7C_tSrlgDYHgcwVHUO-4E2PzbbjQ/viewform', visitCount: 3612 },
      { id: '6dac10fb-3d67-4428-bf26-0f7c2e1f1295', shortCode: 'KSAI', originalUrl: 'https://forms.gle/AHJ2cn3MNc1dMj7K9', visitCount: 6245 },
      { id: 'd9959aec-d846-455a-9e20-a9da0b664d69', shortCode: 'khaosatnhucauthuctapvavieclamcuasinhvienHCMUTE', originalUrl: 'https://forms.gle/VGRnLDu8GMBc5VZu5', visitCount: 8621 },
      { id: 'a5413a6e-19cc-43b5-b7ce-b3c289ff1b02', shortCode: 'HQDHTT-SV25', originalUrl: 'https://forms.gle/aWY2AEtvzVfT2YKK6', visitCount: 3636 },
      { id: 'bfd539c6-f09b-40ff-ba87-c7616d88f225', shortCode: 'TriAnNguoiLaiDo', originalUrl: 'https://forms.gle/DagAtUbPsNnZiXcF8', visitCount: 3145 },
      { id: 'ce2f6892-5787-4b61-abda-c258d23d00a0', shortCode: 'SVveTHPT2026', originalUrl: 'https://forms.gle/JEqvFrqPgCoMKBeu9', visitCount: 2380 },
      { id: 'c0c22ca6-a05c-4954-a116-86f70057e5ba', shortCode: 'EROSeminarBoschVietnam', originalUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSeTZXv3qCgufJBgJayXwej-xi-vVydxPcNuAbiwp_9Qq0QuaA/viewform?usp=dialog', visitCount: 2153 },
      { id: '810869b0-0355-4f1b-ba13-d7f959d53840', shortCode: 'EROSeminarBoschHcP26', originalUrl: 'https://forms.gle/4iiWYsynC9z3B5Ek6', visitCount: 2112 },
      { id: 'c41b1931-1c6c-4e3f-a50b-8f045092655d', shortCode: 'EROSeminarABB', originalUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSebFqrGFNJHXj3_LBYnWLdXyWlnIGsQomcgPgjXRkaxl467yw/viewform?usp=dialog', visitCount: 1992 },
      { id: '6c0c9839-fab2-4da4-9736-e8ffcee9ff94', shortCode: 'EROSeminarLEGO', originalUrl: 'https://forms.gle/BbYprVVSLdCyxwVq6', visitCount: 1960 },
      { id: '0c3bab92-cd81-4dfd-abda-53c8c7a8b01c', shortCode: 'EROpartnershipdayTTI', originalUrl: 'https://forms.office.com/pages/responsepage.aspx?id=z8aMi6oOZEuY5G1GcsRJMLDLFCE0NehFjdWuZi0YRZdUOFg1RUlDTzJaWEgzUUpPWTFJWEJaRjQ3Vy4u&route=shorturl', visitCount: 1733 },
      { id: '1fa49ea5-b117-4d4d-9d06-939d38fb6b23', shortCode: 'EROSeminarAMAZON', originalUrl: 'https://forms.gle/1g6g9xaTGNZr3ogX8', visitCount: 1646 },
    ];

    let created = 0;
    let skipped = 0;

    for (const link of linksToMigrate) {
      try {
        await prisma.url.create({
          data: {
            id: link.id,
            shortCode: link.shortCode,
            originalUrl: link.originalUrl,
            visitCount: link.visitCount,
            userId: null, // No owner - can be claimed later
          },
        });
        created++;
      } catch {
        // Likely duplicate shortCode
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: linksToMigrate.length,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}

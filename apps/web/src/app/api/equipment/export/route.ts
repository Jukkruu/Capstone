import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (!['GCP', 'ADMIN'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());
  const where: any = {};
  if (query.status) where.submissionStatus = query.status;
  if (query.category) where.category = { contains: query.category, mode: 'insensitive' };

  const items = await prisma.equipment.findMany({
    where,
    select: {
      id: true, assetCode: true, tagNumber: true, nameEn: true, nameTh: true,
      category: true, subCategory: true, brand: true, model: true,
      submissionStatus: true, recordStatus: true, createdAt: true, updatedAt: true,
      supplier: { select: { name: true, supplierCode: true } },
      location: { select: { storeCode: true, buildingZone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  });
  return NextResponse.json(items);
}

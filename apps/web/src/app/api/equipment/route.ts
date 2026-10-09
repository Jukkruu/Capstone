import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;

  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());
  const where: any = {};

  if (query.status) where.submissionStatus = query.status;
  if (query.recordStatus) where.recordStatus = query.recordStatus;
  if (query.category) where.category = { contains: query.category, mode: 'insensitive' };
  if (query.search) {
    where.OR = [
      { nameEn: { contains: query.search, mode: 'insensitive' } },
      { nameTh: { contains: query.search, mode: 'insensitive' } },
      { tagNumber: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
      { model: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (user.type === 'supplier') {
    where.supplierId = user.id;
  }

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
    take: query.limit ? Number(query.limit) : 50,
    skip: query.offset ? Number(query.offset) : 0,
  });

  return NextResponse.json(items);
}

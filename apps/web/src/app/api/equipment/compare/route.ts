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

  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').filter(Boolean);
  const items = await prisma.equipment.findMany({
    where: { id: { in: ids } },
    include: { warranty: true, supplier: { select: { name: true } } },
  });
  return NextResponse.json(items);
}

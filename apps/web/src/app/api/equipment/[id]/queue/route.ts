import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RecordStatus } from '@prisma/client';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (!['SUPPLIER', 'ADMIN'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const eq = await prisma.equipment.update({
    where: { id: params.id },
    data: { recordStatus: RecordStatus.QUEUED },
  });
  return NextResponse.json(eq);
}

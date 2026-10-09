import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SupplierStatus } from '@prisma/client';

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (!['ADMIN', 'EDITOR'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const s = await prisma.supplier.update({
    where: { id: params.id },
    data: { accountStatus: SupplierStatus.INACTIVE },
    select: { id: true, accountStatus: true },
  });
  return NextResponse.json(s);
}

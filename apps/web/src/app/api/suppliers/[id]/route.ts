import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (!['ADMIN', 'EDITOR', 'GCP'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const s = await prisma.supplier.findUnique({
    where: { id: params.id },
    select: {
      id: true, supplierCode: true, name: true, taxId: true,
      contactEmail: true, contactPhone: true, address: true,
      leadTimeDays: true, contractPrice: true, accountStatus: true,
      mustChangePassword: true, registrationType: true, registeredAt: true,
      registeredBy: { select: { displayName: true, email: true } },
      _count: { select: { equipment: true } },
    },
  });
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(s);
}

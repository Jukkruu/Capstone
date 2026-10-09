import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';
import { calcTco, calcCarbon, sanitizeUpdate } from '@/lib/equipment-calc';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;

  const eq = await prisma.equipment.findUnique({
    where: { id: params.id },
    include: {
      supplier: { select: { id: true, name: true, supplierCode: true, contactEmail: true } },
      location: true,
      assetType: true,
      serviceType: true,
      warranty: true,
      bom: { include: { part: true } },
      spareParts: true,
      documents: true,
      syncLogs: { orderBy: { runAt: 'desc' }, take: 10 },
    },
  });
  if (!eq) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (user.type === 'supplier' && eq.supplier?.id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(eq);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;

  const existing = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (user.type === 'supplier' && (existing as any).supplierId !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const dto = await req.json();
  const merged = { ...existing, ...dto };
  const tco = calcTco(merged);
  const carbon = calcCarbon(merged);

  const updated = await prisma.equipment.update({
    where: { id: params.id },
    data: {
      ...sanitizeUpdate(dto),
      tcoTotal: tco ?? undefined,
      co2PerYear: carbon?.co2PerYear ?? undefined,
      co2Lifetime: carbon?.co2Lifetime ?? undefined,
      carbonCreditValue: carbon?.carbonCreditValue ?? undefined,
      updatedBy: user.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      equipmentId: params.id,
      userId: user.type === 'bigc' ? user.id : undefined,
      supplierId: user.type === 'supplier' ? user.id : undefined,
      action: AuditAction.UPDATE,
      oldValue: existing as any,
      newValue: dto,
    },
  });

  return NextResponse.json(updated);
}

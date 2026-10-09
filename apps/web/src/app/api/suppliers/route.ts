import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RegistrationType, SupplierStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (!['ADMIN', 'EDITOR', 'GCP'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const items = await prisma.supplier.findMany({
    where: {
      ...(status && { accountStatus: status as SupplierStatus }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contactEmail: { contains: search, mode: 'insensitive' } },
          { taxId: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    select: {
      id: true, supplierCode: true, name: true, contactEmail: true,
      contactPhone: true, accountStatus: true, registrationType: true,
      registeredAt: true, leadTimeDays: true,
      registeredBy: { select: { displayName: true } },
    },
    orderBy: { registeredAt: 'desc' },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (!['ADMIN', 'EDITOR'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const dto = { ...body, contactEmail: body.contactEmail || body.email, contactPhone: body.contactPhone || body.phone };

  const exists = await prisma.supplier.findFirst({
    where: { OR: [{ contactEmail: dto.contactEmail }, ...(dto.taxId ? [{ taxId: dto.taxId }] : [])] },
  });
  if (exists) return NextResponse.json({ error: 'Email or Tax ID already registered' }, { status: 409 });

  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const count = await prisma.supplier.count();
  const supplierCode = `SUP-${String(count + 1).padStart(5, '0')}`;

  const supplier = await prisma.supplier.create({
    data: {
      supplierCode,
      name: dto.name,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      taxId: dto.taxId || undefined,
      address: dto.address,
      leadTimeDays: dto.leadTimeDays,
      passwordHash,
      registrationType: dto.registrationType || RegistrationType.SINGLE,
      registeredById: user.id,
    },
    select: { id: true, supplierCode: true, name: true, contactEmail: true },
  });
  return NextResponse.json({ ...supplier, tempPassword });
}
